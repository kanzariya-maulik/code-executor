import Editor from "@monaco-editor/react";
import { useFileContext } from "../context/FileContext";
import FileBar from "./ui/FileBar";
import { getMonacoLanguageFromFileName } from "../utils/lang";
import { useCodeContext } from "../context/CodeContext";
import { debounce } from "../utils/debounce";
import { useCallback } from "react";

function CodeEditor() {
  const { getFileCode, updateFileContent } = useCodeContext();
  const { currentOpenFile } = useFileContext();

  const debouncedSave = useCallback(
    debounce((name: string, path: string, content: string) => {
      updateFileContent(name, path, content);
    }, 1000),
    [],
  );

  function handleEditorChange(value: string | undefined) {
    debouncedSave(
      currentOpenFile?.name!,
      currentOpenFile?.path!,
      value || "",
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      <div>
        <FileBar />
      </div>
      {currentOpenFile ? (
        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            language={getMonacoLanguageFromFileName(currentOpenFile?.name!)}
            theme="vs-dark"
            defaultValue="// Write your code here..."
            value={getFileCode(currentOpenFile?.name!, currentOpenFile?.path!)}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              padding: { top: 10 },
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#d4d4d4]">
          <div className="max-w-xl w-full text-left space-y-6 font-mono">
            <h1 className="text-3xl font-semibold text-white text-center">
              Welcome to Code Runner
            </h1>

            <p className="text-sm text-gray-400 text-center">
              Your local playground for writing and running code.
            </p>

            <div className="border-t border-gray-700 my-4" />

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-400">➜</span>
                <span>
                  Open or create a file from the{" "}
                  <span className="text-blue-400">sidebar</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-400">➜</span>
                <span>
                  Start typing your code in the{" "}
                  <span className="text-purple-400">editor</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-green-400">➜</span>
                <span>
                  Run commands in the{" "}
                  <span className="text-yellow-400">terminal</span> below
                </span>
              </div>
            </div>

            <div className="pt-6 text-xs text-gray-500 text-center">
              → Minimal UI. Maximum focus.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
