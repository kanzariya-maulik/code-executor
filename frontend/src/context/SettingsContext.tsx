import React, { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextType {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return (
      localStorage.getItem("exec_runner_model") || "qwen3-coder-next:cloud"
    );
  });

  useEffect(() => {
    localStorage.setItem("exec_runner_model", selectedModel);
  }, [selectedModel]);

  return (
    <SettingsContext.Provider
      value={{
        isSettingsOpen,
        setIsSettingsOpen,
        selectedModel,
        setSelectedModel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
