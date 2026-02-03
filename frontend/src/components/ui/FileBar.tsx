import { useFileContext } from "../../context/FileContext";
const FileBar = () => {
  const { openFiles, closeFile, setCurrentOpenFile, currentOpenFile } =
    useFileContext();

  return (
    <div
      className="
        flex
        h-9
        bg-[var(--vscode-title-bar-bg)]
        border-b
        border-[var(--vscode-panel-border)]
        overflow-x-auto
        no-scrollbar
      "
    >
      {openFiles.map((file) => {
        const isActive = file.path === currentOpenFile?.path;

        return (
          <div
            key={file.path}
            onClick={() => setCurrentOpenFile(file)}
            className={`
              group
              flex
              items-center
              gap-2
              px-3
              text-sm
              cursor-pointer
              select-none
              border-r
              border-[var(--vscode-panel-border)]
              max-w-[200px]

              ${
                isActive
                  ? "bg-[var(--vscode-tab-active-bg)] text-[var(--vscode-text)]"
                  : "bg-[var(--vscode-tab-inactive-bg)] text-[var(--vscode-text-muted)] hover:bg-[var(--vscode-list-hover)]"
              }
            `}
          >
            {/* File name */}
            <span className="truncate">{file.name}</span>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className={`
                ml-1
                opacity-0
                group-hover:opacity-100
                ${isActive ? "opacity-100" : ""}
                hover:bg-[var(--vscode-list-hover)]
                rounded-sm
                p-[2px]
              `}
            >
              X
            </button>

            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--vscode-status-bar-bg)]" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileBar;
