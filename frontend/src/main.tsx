import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SocketProvider } from "./context/SocketContext";
import { FileProvider } from "./context/FileContext.tsx";
import { CodeProvider } from "./context/CodeContext.tsx";
import { SettingsProvider } from "./context/SettingsContext.tsx";

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <FileProvider>
      <CodeProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </CodeProvider>
    </FileProvider>
  </SocketProvider>,
);
