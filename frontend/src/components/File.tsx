import Editor from "@monaco-editor/react";
import { useState } from "react";
// import { useSocketContext } from "../hooks/useSocket";

function CodeEditor() {
  const [code, setCode] = useState("");
  // const { socket } = useSocketContext();

  function handleEditorChange(value: string | undefined) {
    console.log("here is the current model value:", value);
    setCode(value || "");
    // socket?.emit("files:update", value || "");
  }

  // useEffect(() => {
  //   socket?.on("files:update", (data: string) => {
  //     setCode(data);
  //   });
  //   return () => {
  //     socket?.off("files:update");
  //   };
  // }, [socket]);

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language="typescript"
          theme="vs-dark"
          defaultValue="// Write your code here..."
          value={code}
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
    </div>
  );
}

export default CodeEditor;
