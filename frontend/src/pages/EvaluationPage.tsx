import React, { useState } from 'react';
import {
  Activity,
  Play,
  CheckCircle2,
  Clock,
  Target,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationSuiteResponse, SingleEvaluationResult } from '../types';

export const EvaluationPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [suiteResult, setSuiteResult] = useState<EvaluationSuiteResponse | null>(null);

  const handleRunEvaluation = async () => {
    setRunning(true);
    try {
      const res = await api.runEvaluation({
        top_k: 4,
        similarity_threshold: 0.15,
        mode: 'hybrid',
        hybrid_alpha: 0.70,
      });
      setSuiteResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">RAG Evaluation & Benchmark Suite</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quantify retrieval quality and answer fidelity across Precision@K, Recall@K, Faithfulness, and Latency.
          </p>
        </div>
        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 disabled:opacity-50 transition flex items-center space-x-2 shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{running ? 'Running Benchmark Test Cases...' : 'Execute Evaluation Suite'}</span>
        </button>
      </div>

      {/* Metric Explanations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-sky-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center space-x-1">
            <Target className="w-3.5 h-3.5 text-sky-600" />
            <span>Precision@K</span>
          </span>
          <p className="text-xs text-slate-600">
            Proportion of retrieved chunks that are genuinely relevant to the question.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recall@K</span>
          </span>
          <p className="text-xs text-slate-600">
            Proportion of all target reference documents captured in the top-K retrieved list.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faithfulness</span>
          </span>
          <p className="text-xs text-slate-600">
            Grounding ratio: claims in answer directly substantiated by context (anti-hallucination).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Latency</span>
          </span>
          <p className="text-xs text-slate-600">
            Split time: vector distance calculation + keyword indexing + LLM token generation.
          </p>
        </div>
      </div>

      {/* Benchmark Summary KPI Cards */}
      {suiteResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Mean Precision@K</span>
              <p className="text-3xl font-extrabold text-sky-700 mt-2">
                {(suiteResult.mean_precision_at_k * 100).toFixed(1)}%
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${suiteResult.mean_precision_at_k * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Mean Recall@K</span>
              <p className="text-3xl font-extrabold text-indigo-700 mt-2">
                {(suiteResult.mean_recall_at_k * 100).toFixed(1)}%
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${suiteResult.mean_recall_at_k * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Faithfulness</span>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">
                {(suiteResult.mean_faithfulness_score * 100).toFixed(1)}%
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${suiteResult.mean_faithfulness_score * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Avg Roundtrip</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {suiteResult.avg_total_latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Retrieval: {suiteResult.avg_retrieval_latency_ms}ms • Gen: {suiteResult.avg_generation_latency_ms}ms
              </p>
            </div>

          </div>

          {/* Test Cases Table */}
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Individual Benchmark Test Cases ({suiteResult.total_test_cases})
              </h3>
              <span className="text-xs text-slate-400 font-mono">Run: {suiteResult.run_timestamp}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {suiteResult.results.map((item, idx) => (
                <div key={idx} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      #{idx + 1}: {item.question}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                        Precision: {(item.precision_at_k * 100).toFixed(0)}%
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Faithfulness: {(item.faithfulness_score * 100).toFixed(0)}%
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600">
                        {item.total_latency_ms} ms
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-500 uppercase tracking-wide block mb-1">Expected Ground Truth:</span>
                      <p className="text-slate-700 font-medium">{item.expected_answer}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200">
                      <span className="font-bold text-sky-700 uppercase tracking-wide block mb-1">Generated Grounded Answer:</span>
                      <p className="text-sky-900 font-medium">{item.generated_answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!suiteResult && !running && (
        <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-white border border-slate-200 space-y-3">
          <Activity className="w-10 h-10 text-sky-400 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">Ready to evaluate your RAG pipeline</p>
          <p className="max-w-md mx-auto text-slate-500">
            Click "Execute Evaluation Suite" above to run the automated benchmark dataset across retrieval accuracy, hallucination prevention, and latency.
          </p>
        </div>
      )}

    </div>
  );
};

