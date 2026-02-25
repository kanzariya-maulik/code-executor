import { useState, useMemo, useEffect, useRef } from "react";
import {
  Settings,
  LayoutPanelLeft,
  File,
  Search as SearchIcon,
} from "lucide-react";
import { useSocketContext } from "../hooks/useSocket";
import { useFileContext } from "../context/FileContext";
import { useSettings } from "../context/SettingsContext";
import type { FileTree, FileNode } from "../types";

// Helper to flatten the file tree for searching
const flattenFileTree = (tree: FileTree): FileNode[] => {
  let result: FileNode[] = [];
  for (const key in tree) {
    const node = tree[key];
    if (node.type === "file") result.push(node);
    else if (node.type === "dir" && node.children)
      result = result.concat(flattenFileTree(node.children));
  }
  return result;
};

export default function TopBar() {
  const { isConnected, isLoading } = useSocketContext();
  const { fileTree, setOpenFiles, setCurrentOpenFile } = useFileContext();
  const { setIsSettingsOpen } = useSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const flatFiles = useMemo(() => flattenFileTree(fileTree), [fileTree]);
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return [];
    return flatFiles
      .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10);
  }, [flatFiles, searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFile = (file: FileNode) => {
    setOpenFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) return prev;
      return [...prev, file];
    });
    setCurrentOpenFile(file);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <div className="h-10 w-full bg-[#323233] border-b border-[#2b2b2b] flex items-center justify-between px-4 shrink-0 select-none">
      {/* Left: App Title and Status */}
      <div className="flex items-center gap-2 text-[#cccccc] min-w-[200px]">
        <LayoutPanelLeft size={16} className="opacity-70" />
        <span className="text-[13px] font-semibold tracking-wide flex items-center gap-2">
          EXEC RUNNER
          {isLoading ? (
            <span className="text-[#858585] text-xs font-normal opacity-70 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-[#858585] border-t-transparent animate-spin"></span>
              Connecting...
            </span>
          ) : isConnected ? (
            <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
          )}
        </span>
      </div>

      {/* Center: Search Files Input */}
      <div
        className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6 relative"
        ref={searchRef}
      >
        <div className="w-full bg-[#3c3c3c] focus-within:bg-[#1e1e1e] focus-within:border-[#007acc] transition-colors h-7 rounded border border-[#1e1e1e] flex items-center px-3 text-[#cccccc]">
          <SearchIcon size={14} className="opacity-50 mr-2" />
          <input
            type="text"
            placeholder="Search files (Cmd+P)..."
            className="w-full h-full bg-transparent outline-none text-[12px] placeholder:text-[#858585]"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery && (
          <div className="absolute top-9 w-full bg-[#252526] border border-[#2b2b2b] rounded shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#2a2d2e] cursor-pointer text-[#cccccc]"
                >
                  <File size={14} className="opacity-70 shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="text-[12px] truncate">{file.name}</span>
                    <span className="text-[10px] opacity-50 truncate">
                      {file.path}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-[12px] text-[#858585] text-center">
                No files found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 min-w-[200px] justify-end">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 hover:bg-[#444444] rounded text-[#cccccc] transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
