import React from "react";
import { useSocketContext } from "./hooks/useSocket";
import Sidebar from "./components/Sidebar";
import TerminalComponent from "./components/Terminal";
import File from "./components/File";

const App: React.FC = () => {
  const { isConnected, isLoading } = useSocketContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading Environment...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-medium">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
          <p className="text-slate-400 mb-6">
            Could not establish a connection to the server. Please ensure the
            backend is running on port 3000.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 transition-colors rounded-lg font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-200 overflow-hidden">
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 min-h-0 bg-slate-900">
          <File />
        </div>
        <div className="h-1/3 min-h-[200px] border-t border-slate-800 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Terminal
            </span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <TerminalComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
