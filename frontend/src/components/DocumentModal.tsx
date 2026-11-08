import React from 'react';
import { X, FileText, Calendar, Database, Hash } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs uppercase">
              {document.file_type.replace('.', '')}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{document.filename}</h3>
              <p className="text-xs text-slate-500">
                Uploaded on {new Date(document.upload_date).toLocaleDateString()} • {(document.file_size_bytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chunks List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Extracted Chunks ({document.chunks?.length || document.chunk_count})
            </span>
            <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
              Chunk Size: 500 chars • Overlap: 100 chars
            </span>
          </div>

          {document.chunks && document.chunks.length > 0 ? (
            <div className="space-y-3">
              {document.chunks.map((chunk, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-sky-800">Chunk #{chunk.chunk_index + 1}</span>
                    <span>Page {chunk.page} • {chunk.char_count} chars</span>
                  </div>
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Chunk excerpts are being indexed or are loaded on demand.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
