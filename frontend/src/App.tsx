import React from "react";
import { useSocketContext } from "./hooks/useSocket";
import Sidebar from "./components/Sidebar";
import TerminalComponent from "./components/Terminal";
import File from "./components/File";
import TopBar from "./components/TopBar";
import SettingsModal from "./components/ui/SettingsModal";
// @ts-ignore
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const App: React.FC = () => {
  const { isConnected, isLoading } = useSocketContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-[#cccccc] font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#007acc] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#858585]">Starting Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-[#cccccc] font-medium">
        <div className="bg-[#252526] p-8 rounded border border-[#2b2b2b] max-w-md text-center shadow-lg">
          <h1 className="text-xl font-medium text-white mb-2">
            Connection Lost
          </h1>
          <p className="text-[#858585] mb-6 text-sm">
            Could not establish a connection to the runner server. Ensure the
            backend container is running.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#007acc] hover:bg-[#0098ff] transition-colors rounded text-white text-sm"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans">
      <TopBar />
      <SettingsModal />

      <div className="flex flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className="flex flex-col border-r border-[#2b2b2b] bg-[#252526]"
          >
            <Sidebar />
          </Panel>

          <PanelResizeHandle className="w-1 bg-transparent hover:bg-[#007acc] transition-colors cursor-col-resize z-50" />

          <Panel className="flex flex-col min-w-0 bg-[#1e1e1e]">
            <PanelGroup direction="vertical">
              <Panel
                defaultSize={70}
                minSize={20}
                className="flex flex-col relative min-h-0"
              >
                <File />
              </Panel>

              <PanelResizeHandle className="h-1 bg-transparent hover:bg-[#007acc] transition-colors cursor-row-resize z-50 relative" />

              <Panel
                defaultSize={30}
                minSize={10}
                className="flex flex-col min-h-0 bg-[#1e1e1e] border-t border-[#2b2b2b]"
              >
                {/* Terminal Panel Header */}
                <div className="flex items-center px-4 h-9 border-b border-[#2b2b2b] bg-[#1e1e1e] shrink-0">
                  <div className="text-[11px] uppercase tracking-wider font-medium text-[#cccccc] border-b border-[#007acc] h-full flex items-center cursor-pointer">
                    TERMINAL
                  </div>
                </div>
                {/* Terminal Content Box */}
                <div className="flex-1 min-h-0 relative p-2">
                  <TerminalComponent />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default App;
