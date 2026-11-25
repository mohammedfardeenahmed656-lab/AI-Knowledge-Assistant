import React from 'react';
import { X, FileText, Bookmark, ExternalLink } from 'lucide-react';
import { Citation } from '../types';

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-sky-100 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              [{citation.index}]
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{citation.filename}</h3>
              <p className="text-xs text-slate-500">Document Source Page {citation.page}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Bookmark className="w-4 h-4 text-sky-600" />
            <span>Retrieved Source Passage:</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            "{citation.preview_text}"
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Chunk ID: {citation.chunk_id}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};

