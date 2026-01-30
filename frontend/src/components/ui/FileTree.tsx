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
                flex items-center gap-2 py-1 px-2 text-sm cursor-pointer rounded
                ${isSelected ? "bg-neutral-900 text-white" : "text-neutral-300"}
                hover:bg-neutral-800
              `}
              onClick={() => onSelect(node)}
            >
              {/* Arrow */}
              {isDir && (
                <span
                  className="w-3 text-xs text-neutral-500 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollapsed((c) => ({
                      ...c,
                      [node.path]: !c[node.path],
                    }));
                  }}
                >
                  {isCollapsed ? "▸" : "▾"}
                </span>
              )}

              {/* Icon */}
              <span className="text-neutral-500">
                {isDir ? <FolderIcon /> : <FileIcone />}
              </span>

              {/* Name */}
              <span className="truncate">{name}</span>
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
