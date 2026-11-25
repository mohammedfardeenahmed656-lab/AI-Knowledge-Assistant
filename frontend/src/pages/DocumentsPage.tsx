import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  HardDrive,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { DocumentModal } from '../components/DocumentModal';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    try {
      setUploadProgressStage('Step 1/6: Validating file extension & constraints...');
      await new Promise(r => setTimeout(r, 200));

      setUploadProgressStage('Step 2/6: Extracting text & page structures...');
      await new Promise(r => setTimeout(r, 200));

      setUploadProgressStage('Step 3/6: Cleaning whitespace & preserving tables...');
      await new Promise(r => setTimeout(r, 200));

      setUploadProgressStage('Step 4/6: Recursive character chunking...');
      await new Promise(r => setTimeout(r, 200));

      setUploadProgressStage('Step 5/6: Generating 384-dimensional dense embeddings...');
      await new Promise(r => setTimeout(r, 200));

      setUploadProgressStage('Step 6/6: Indexing into ChromaDB & BM25 inverted index...');
      const result = await api.uploadDocument(file);

      setUploadSuccess(`Indexed "${file.name}" into ${result.document.chunk_count} chunks.`);
      loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to ingest file');
    } finally {
      setUploading(false);
      setUploadProgressStage('');
    }
  };

  const handleDeleteDocument = async (id: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" and its vector embeddings?`)) return;
    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleInspectDocument = async (id: string) => {
    try {
      const fullDoc = await api.getDocument(id);
      setSelectedDoc(fullDoc);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Document Hub & Ingestion Engine</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload PDF, Word (DOCX), Markdown, or plain text documents into the RAG vector knowledge base.
          </p>
        </div>
        <button
          onClick={loadDocuments}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Documents</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition ${
          uploading
            ? 'border-sky-400 bg-sky-50/50 pointer-events-none'
            : 'border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">
              Click to select or drag and drop document here
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PDF, DOCX, TXT, and Markdown (.md) up to 15 MB
            </p>
          </div>

          {uploading && (
            <div className="p-3 rounded-xl bg-sky-100/70 text-sky-900 text-xs font-semibold animate-pulse space-y-1">
              <p>{uploadProgressStage}</p>
              <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-600 h-full w-2/3 animate-[progress_1s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center justify-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ingested Documents Table */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Indexed Documents ({documents.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Total Vectors: {documents.reduce((acc, d) => acc + d.chunk_count, 0)}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading document catalog...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <HardDrive className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No documents uploaded yet. Use the upload box above to ingest your first file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">File Size</th>
                  <th className="px-6 py-3">Chunks</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Upload Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>{doc.filename}</span>
                    </td>
                    <td className="px-6 py-3.5 uppercase font-bold text-sky-800">
                      {doc.file_type.replace('.', '')}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-indigo-700">
                      {doc.chunk_count}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(doc.upload_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleInspectDocument(doc.id)}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100 transition shadow-2xs"
                        title="View chunks"
                      >
                        Inspect Chunks
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Chunks Inspector Modal */}
      <DocumentModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

    </div>
  );
};

