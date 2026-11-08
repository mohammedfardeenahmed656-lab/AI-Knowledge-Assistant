import React from 'react';
import {
  BrainCircuit,
  MessageSquare,
  Files,
  Search,
  Activity,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  providerInfo?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  providerInfo
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Assistant Chat', icon: MessageSquare },
    { id: 'documents', label: 'Document Hub', icon: Files },
    { id: 'search', label: 'Hybrid Search Lab', icon: Search },
    { id: 'evaluation', label: 'RAG Evaluation', icon: Activity },
    { id: 'learning', label: 'Interactive Learning', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-sky-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Knowledge<span className="text-sky-600">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  RAG v1.0
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium hidden sm:block">
                Production Retrieval-Augmented Generation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-200'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Engine Status Pill */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="truncate max-w-[150px]">{providerInfo || 'Vector Engine Ready'}</span>
            </div>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition border border-transparent hover:border-sky-200"
              title="RAG Hyperparameters & Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-100 px-4 py-2 space-x-1 scrollbar-none bg-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive ? 'bg-sky-100 text-sky-800' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
