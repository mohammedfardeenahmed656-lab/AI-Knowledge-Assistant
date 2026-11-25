import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SettingsModal } from './components/SettingsModal';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SearchLabPage } from './pages/SearchLabPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { LearningPage } from './pages/LearningPage';
import { RAGSettings } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [providerInfo, setProviderInfo] = useState<string>('ChromaDB + SentenceTransformers');

  const [settings, setSettings] = useState<RAGSettings>({
    top_k: 4,
    similarity_threshold: 0.15,
    search_mode: 'hybrid',
    hybrid_alpha: 0.70,
  });

  useEffect(() => {
    // Check backend health and active model on mount
    api.getHealth()
      .then((h) => {
        setProviderInfo(`${h.vector_store} • ${h.embedding_provider}`);
      })
      .catch(() => {
        setProviderInfo('Offline Mode (Local Fallback Active)');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        providerInfo={providerInfo}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'chat' && <ChatPage settings={settings} onOpenSettings={() => setIsSettingsOpen(true)} />}
        {activeTab === 'documents' && <DocumentsPage />}
        {activeTab === 'search' && <SearchLabPage />}
        {activeTab === 'evaluation' && <EvaluationPage />}
        {activeTab === 'learning' && <LearningPage />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => setSettings(newSettings)}
      />

      {/* Persistent Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Knowledge Assistant • Full-Stack Modular RAG Pipeline</span>
          <span>FastAPI • React TypeScript • ChromaDB • Tailwind CSS</span>
        </div>
      </footer>

    </div>
  );
};

export default App;

