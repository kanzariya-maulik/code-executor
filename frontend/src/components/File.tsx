import React, { useState } from "react";
import Editor from "@monaco-editor/react";

function CodeEditor() {
  const [code, setCode] = useState<string | undefined>("// Start coding here!");

  function handleEditorChange(value: string | undefined) {
    setCode(value);
    console.log("here is the current model value:", value);
  }

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
