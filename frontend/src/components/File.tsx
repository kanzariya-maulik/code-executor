import Editor, { useMonaco } from "@monaco-editor/react";
import { useFileContext } from "../context/FileContext";
import FileBar from "./ui/FileBar";
import { getMonacoLanguageFromFileName } from "../utils/lang";
import { useCodeContext } from "../context/CodeContext";
import { useSettings } from "../context/SettingsContext";
import { debounce } from "../utils/debounce";
import { useCallback, useEffect, useRef } from "react";

function CodeEditor() {
  const { getFileCode, updateFileContent } = useCodeContext();
  const { currentOpenFile } = useFileContext();
  const { selectedModel } = useSettings();
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
            console.log("Auto-complete triggered! Waiting for 1 second...");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (token.isCancellationRequested) {
              console.log(
                "Auto-complete aborted because user typed something else.",
              );
              return { items: [] };
            }

            console.log("1 second passed! Fetching code around cursor...");
            const codeUpToCursor = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const codeAfterCursor = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: model.getLineCount(),
              endColumn: model.getLineMaxColumn(model.getLineCount()),
            });

            console.log("Code up to cursor length:", codeUpToCursor.length);

            try {
              console.log("Sending request to suggestions backend...");
              const res = await fetch("http://localhost:3000/suggestions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  currentCode: codeUpToCursor,
                  codeAfter: codeAfterCursor,
                  modelName: selectedModel,
                  language: getMonacoLanguageFromFileName(currentOpenFile.name),
                }),
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
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
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
        <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] text-[#858585] select-none">
          <svg
            className="w-24 h-24 mb-6 opacity-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m10 13-2 2 2 2" />
            <path d="m14 17 2-2-2-2" />
          </svg>
          <div className="text-sm font-medium tracking-wide">EXEC RUNNER</div>
          <div className="text-xs opacity-60 mt-2 flex items-center gap-4">
            <span>Cmd+P to Search</span>
            <span>•</span>
            <span>Select a file to begin</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
