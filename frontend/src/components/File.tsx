import Editor, { useMonaco } from "@monaco-editor/react";
import { useFileContext } from "../context/FileContext";
import FileBar from "./ui/FileBar";
import { getMonacoLanguageFromFileName } from "../utils/lang";
import { useCodeContext } from "../context/CodeContext";
import { debounce } from "../utils/debounce";
import { useCallback, useEffect, useRef } from "react";

function CodeEditor() {
  const { getFileCode, updateFileContent } = useCodeContext();
  const { currentOpenFile } = useFileContext();
  const monaco = useMonaco();
  const providerRef = useRef<any>(null);

  const debouncedSave = useCallback(
    debounce((name: string, path: string, content: string) => {
      updateFileContent(name, path, content);
    }, 1000),
    [],
  );

  function handleEditorChange(value: string | undefined) {
    debouncedSave(currentOpenFile?.name!, currentOpenFile?.path!, value || "");
  }

  useEffect(() => {
    if (monaco && currentOpenFile) {
      if (providerRef.current) {
        providerRef.current.dispose();
      }

      const language = getMonacoLanguageFromFileName(currentOpenFile.name);

      providerRef.current = monaco.languages.registerInlineCompletionsProvider(
        language,
        {
          provideInlineCompletions: async (
            model,
            position,
            _context,
            token,
          ) => {
            console.log("Auto-complete triggered! Waiting for 10 seconds...");
            // Wait for 10 seconds (10000ms) before fetching
            await new Promise((resolve) => setTimeout(resolve, 10000));

            // If the user typed something else while waiting, abort
            if (token.isCancellationRequested) {
              console.log(
                "Auto-complete aborted because user typed something else.",
              );
              return { items: [] };
            }

            console.log("10 seconds passed! Fetching code up to cursor...");
            const codeUpToCursor = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            console.log("Code up to cursor length:", codeUpToCursor.length);

            try {
              console.log("Sending request to suggestions backend...");
              const res = await fetch("http://localhost:3002/suggestions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ currentCode: codeUpToCursor }),
              });

              if (!res.ok) {
                console.log(
                  "Suggestion request failed with status:",
                  res.status,
                );
                return { items: [] };
              }

              const data = await res.json();
              console.log("Received data from backend:", data);

              if (data.suggestion) {
                console.log("Returning suggestion to editor:", data.suggestion);
                return {
                  items: [
                    {
                      insertText: data.suggestion,
                      range: new monaco.Range(
                        position.lineNumber,
                        position.column,
                        position.lineNumber,
                        position.column,
                      ),
                    },
                  ],
                };
              } else {
                console.log("No suggestion returned from backend.");
              }
            } catch (error) {
              console.error("Fetch request threw an error:", error);
            }

            return { items: [] };
          },
          disposeInlineCompletions: () => {},
        },
      );
    }

    return () => {
      if (providerRef.current) {
        providerRef.current.dispose();
      }
    };
  }, [monaco, currentOpenFile?.name]);

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
              inlineSuggest: { enabled: true },
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
