import { createContext, useContext, useEffect, useState } from "react";
import { useSocketContext } from "../hooks/useSocket";

const TerminalContext = createContext<{ terminalIds: string[]; activeId: string | null; addTerminal: (id: string) => void; closeTerminal: (id: string) => void; setActiveTerminal: (id: string) => void }>({
    terminalIds: [],
    activeId: null,
    addTerminal: () => { },
    closeTerminal: () => { },
    setActiveTerminal: () => { },
});

export const TerminalProvider = ({ children }: { children: React.ReactNode }) => {
    const { socket } = useSocketContext();
    const [terminalIds, setTerminalIds] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const addTerminal = (id: string) => {
        socket?.emit("terminal:create", { id });
        setTerminalIds((prev) => [...prev, id]);
        setActiveId(id);
    };

    const closeTerminal = (id: string) => {
        socket?.emit("terminal:close", { id });
        setTerminalIds((prev) => prev.filter((t) => t !== id));
        setActiveId(null);
    };

    const setActiveTerminal = (id: string) => {
        setActiveId(id);
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("terminal:create", ({ id }: { id: string }) => {
            setTerminalIds((prev) => [...prev, id]);
            setActiveId(id);
        });

        socket.on("terminal:close", ({ id }: { id: string }) => {
            setTerminalIds((prev) => prev.filter((t) => t !== id));
            setActiveId(null);
        });

        return () => {
            socket.off("terminal:create");
            socket.off("terminal:close");
        };
    }, [socket]);   

    return (
        <TerminalContext.Provider value={{ terminalIds, activeId, addTerminal, closeTerminal, setActiveTerminal }}>
            {children}
        </TerminalContext.Provider>
    );
};

export const useTerminalContext = () => {
    const context = useContext(TerminalContext);
    if (!context) {
        throw new Error("useTerminalContext must be used within a TerminalProvider");
    }
    return context;
};
