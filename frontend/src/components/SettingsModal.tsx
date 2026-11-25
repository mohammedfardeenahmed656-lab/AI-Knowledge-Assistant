import React from 'react';
import { X, Sliders, Info, RotateCcw } from 'lucide-react';
import { RAGSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RAGSettings;
  onSave: (newSettings: RAGSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = React.useState<RAGSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalSettings({
      top_k: 4,
      similarity_threshold: 0.20,
      search_mode: 'hybrid',
      hybrid_alpha: 0.70,
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-sky-100 max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">RAG Retrieval Hyperparameters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-700">
          
          {/* Top-K Chunks */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Top-K Retrieved Chunks</span>
              <span className="font-mono text-sky-700 font-bold">{localSettings.top_k} chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={localSettings.top_k}
              onChange={(e) => setLocalSettings({ ...localSettings, top_k: parseInt(e.target.value) })}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              The number of nearest context chunks sent to the LLM. Higher values increase context breadth but risk noise.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Similarity Score Threshold</span>
              <span className="font-mono text-sky-700 font-bold">{localSettings.similarity_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.05"
              value={localSettings.similarity_threshold}
              onChange={(e) => setLocalSettings({ ...localSettings, similarity_threshold: parseFloat(e.target.value) })}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Chunks below this minimum cosine threshold are discarded. Prevents hallucinations on off-topic questions.
            </p>
          </div>

          {/* Search Mode */}
          <div className="space-y-1.5">
            <label className="font-semibold block">Retrieval Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['vector', 'keyword', 'hybrid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, search_mode: mode })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                    localSettings.search_mode === mode
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Hybrid Alpha (only visible in hybrid mode) */}
          {localSettings.search_mode === 'hybrid' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-sky-50 border border-sky-100">
              <div className="flex justify-between font-semibold text-sky-900">
                <span>Dense Vector Weight (Alpha)</span>
                <span className="font-mono font-bold">{localSettings.hybrid_alpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={localSettings.hybrid_alpha}
                onChange={(e) => setLocalSettings({ ...localSettings, hybrid_alpha: parseFloat(e.target.value) })}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-sky-700">
                <span>0.0 (Pure BM25 Keyword)</span>
                <span>1.0 (Pure Semantic Vector)</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition"
            >
              Apply Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

