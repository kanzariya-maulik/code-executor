import FileIcone from "../../assets/FileIcone";
import FolderIcon from "../../assets/FolderIcone";
import { useState } from "react";
import type { FileTree, FileTreeNode } from "../../types";

interface Props {
  tree: FileTree;
  depth?: number;
  selectedPath?: string;
  onSelect: (node: FileTreeNode) => void;
}

const INDENT = 14;

const FileTreeView: React.FC<Props> = ({
  tree,
  depth = 0,
  selectedPath,
  onSelect,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <>
      {Object.entries(tree).map(([name, node]) => {
        const isDir = node.type === "dir";
        const isCollapsed = collapsed[node.path];
        const isSelected = node.path === selectedPath;

        return (
          <div key={node.path}>
            {/* Row */}
            <div
              style={{ paddingLeft: depth * INDENT }}
              className={`
                flex items-center gap-1.5 py-[3px] px-2 text-[13px] cursor-pointer select-none transition-colors
                ${isSelected ? "bg-[var(--vscode-list-active)] text-white" : "text-[var(--vscode-text)]"}
                hover:bg-[var(--vscode-list-hover)]
                ${isSelected ? "focus:outline-none" : ""}
              `}
              onClick={() => onSelect(node)}
            >
              {/* Arrow */}
              <span
                className={`w-4 text-center shrink-0 text-neutral-400 ${!isDir ? "invisible" : ""}`}
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
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.1s",
                  }}
                >
                  ▼
                </div>
              </span>

              {/* Icon */}
              <span className="shrink-0">
                {isDir ? <FolderIcon /> : <FileIcone />}
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
    </>
  );
};

export default FileTreeView;
