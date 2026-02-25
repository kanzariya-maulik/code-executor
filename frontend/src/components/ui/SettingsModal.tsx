import React, { useEffect, useState } from "react";
import { X, Sparkles, Check, Loader2 } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: any;
}

const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, selectedModel, setSelectedModel } =
    useSettings();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      fetchModels();
    }
  }, [isSettingsOpen]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/list");
      const data = await response.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#252526] border border-[#333333] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333] bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#007acc]/10 rounded-lg">
              <Sparkles size={18} className="text-[#007acc]" />
            </div>
            <h2 className="text-[15px] font-semibold text-white tracking-tight">
              AI Settings
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 hover:bg-[#3e3e42] rounded-lg text-[#858585] hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-[#cccccc]">
                Auto-complete Model
              </label>
              <p className="text-[11px] text-[#858585]">
                Select the AI model that powers your code suggestions.
              </p>
            </div>

            <div className="relative group">
              {loading ? (
                <div className="w-full h-10 bg-[#1e1e1e] border border-[#333333] rounded-lg flex items-center justify-center gap-2 text-[#858585] text-xs">
                  <Loader2 size={14} className="animate-spin" />
                  Fetching available models...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {models.length > 0 ? (
                    models.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => setSelectedModel(model.name)}
                        className={`
                          flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left
                          ${
                            selectedModel === model.name
                              ? "bg-[#007acc]/10 border-[#007acc] text-white"
                              : "bg-[#1e1e1e] border-[#333333] text-[#cccccc] hover:border-[#454545] hover:bg-[#2a2d2e]"
                          }
                        `}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-medium">
                            {model.name}
                          </span>
                          <span className="text-[10px] opacity-50 uppercase tracking-tighter">
                            {model.details.family} •{" "}
                            {(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                          </span>
                        </div>
                        {selectedModel === model.name && (
                          <Check size={16} className="text-[#007acc]" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-[#1e1e1e] rounded-lg border border-dashed border-[#333333]">
                      <p className="text-xs text-[#858585]">
                        No models found. Ensure Ollama is reachable.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="pt-2">
            <div className="p-3 rounded-lg bg-[#007acc]/5 border border-[#007acc]/20">
              <p className="text-[11px] text-[#858585] leading-relaxed">
                <strong className="text-[#007acc]">Note:</strong> You are
                currently using cloud-migrated models. There is no local compute
                cost; suggestions are processed via Ollama Cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#2d2d2d] border-t border-[#333333]">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-6 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white text-[13px] font-medium rounded-lg transition-colors shadow-lg shadow-[#007acc]/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
