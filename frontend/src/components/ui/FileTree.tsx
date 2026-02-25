import { useState } from "react";
import type { FileTree, FileTreeNode } from "../../types";
import {
  ChevronRight,
  Folder,
  File,
  FileCode2,
  FileJson,
  FileText,
  FileImage,
} from "lucide-react";

interface Props {
  tree: FileTree;
  depth?: number;
  selectedPath?: string;
  onSelect: (node: FileTreeNode) => void;
}

const INDENT = 12;

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (["ts", "tsx", "js", "jsx"].includes(ext || ""))
    return <FileCode2 size={14} className="text-[#e2c08d]" />;
  if (["json", "yml", "yaml"].includes(ext || ""))
    return <FileJson size={14} className="text-[#89d185]" />;
  if (["md", "txt"].includes(ext || ""))
    return <FileText size={14} className="text-[#cccccc]" />;
  if (["png", "jpg", "jpeg", "svg"].includes(ext || ""))
    return <FileImage size={14} className="text-[#4fc1ff]" />;

  return <File size={14} className="text-[#cccccc]" />;
};

const FileTreeView: React.FC<Props> = ({
  tree,
  depth = 0,
  selectedPath,
  onSelect,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col">
      {Object.entries(tree).map(([name, node]) => {
        const isDir = node.type === "dir";
        const isCollapsed = collapsed[node.path];
        const isSelected = node.path === selectedPath;

        return (
          <div key={node.path}>
            {/* Row */}
            <div
              style={{ paddingLeft: depth * INDENT + 4 }}
              className={`
                flex items-center gap-1.5 py-[4px] pr-2 text-[13px] cursor-pointer select-none transition-colors border-l-[3px] border-transparent
                ${isSelected ? "bg-[#37373d] text-white" : "text-[#cccccc]"}
                hover:bg-[#2a2d2e]
                ${isSelected ? "focus:outline-none" : ""}
              `}
              onClick={() => onSelect(node)}
            >
              {/* Arrow */}
              <span
                className={`w-4 flex items-center justify-center shrink-0 text-[#cccccc] ${!isDir ? "invisible" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed((c) => ({
                    ...c,
                    [node.path]: !c[node.path],
                  }));
                }}
              >
                <div
                  style={{
                    transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.1s ease-in-out",
                  }}
                >
                  <ChevronRight size={14} />
                </div>
              </span>

              {/* Icon */}
              <span className="shrink-0 flex items-center justify-center opacity-90">
                {isDir ? (
                  <Folder
                    size={14}
                    className="text-[#dcb67a]"
                    fill={isCollapsed ? "transparent" : "#dcb67a"}
                  />
                ) : (
                  getFileIcon(name)
                )}
              </span>

              {/* Name */}
              <span className="truncate leading-none pt-[1px]">{name}</span>
            </div>

            {/* Children */}
            {isDir && !isCollapsed && (
              <FileTreeView
                tree={node.children}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileTreeView;
