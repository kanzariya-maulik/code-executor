import React from "react";

interface CommandContextType {
    command: string;
    setCommand: (command: string) => void;
}

const CommandContext = React.createContext<CommandContextType>({
    command: "",
    setCommand: (command: string) => {},
});

const CommandProvider = CommandContext.Provider;

const useCommand = () => React.useContext(CommandContext);