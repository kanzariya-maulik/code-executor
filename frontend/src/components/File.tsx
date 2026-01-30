import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useSocketContext } from "../hooks/useSocket";

function CodeEditor() {
  const [code, setCode] = useState("");
  const {socket} = useSocketContext();

  function handleEditorChange(value: string | undefined) {
    console.log("here is the current model value:", value);
    setCode(value || "");
    socket?.emit("files:update", value || "");
  }

  useEffect(() => {
    socket?.on("files:update", (data: string) => {
      setCode(data);
    });
    return () => {
      socket?.off("files:update");
    };
  }, [socket]);

  return (
    <div style={{ height: "500px" }}>
      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        defaultValue="// some default code"
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
        }}
      />
    </div>
  );
}

export default CodeEditor;
