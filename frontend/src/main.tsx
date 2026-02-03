import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SocketProvider } from "./context/SocketContext";
import { FileProvider } from "./context/FileContext.tsx";

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <FileProvider>
      <App />
    </FileProvider>
  </SocketProvider>,
);
