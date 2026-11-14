import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AiInsightsCard({ reportType, date }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const res = await api.get(`/ai/insights?type=${reportType}&date=${date}`);
      setInsights(res.data.data);
    } catch {
      toast.error('Failed to generate AI insights');
    } finally {
      setLoading(false);
    }
  };

  const badgeColorMap = {
    green: 'bg-green-100 text-green-800 border-green-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-2xl border border-sky-200 p-5 shadow-xs mb-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xl shadow-xs">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">
                AI Clinical Insights
              </h3>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Personalized glycemic patterns and physician discussion points
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-xs"
        >
          {loading ? (
            <>
              <span className="animate-spin text-sm">⏳</span> Analyzing data...
            </>
          ) : insights ? (
            <>
              <span>🔄</span> Refresh Insights
            </>
          ) : (
            <>
              <span>✨</span> Generate AI Insights
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-sky-100">
          {loading ? (
            <div className="py-8 text-center animate-pulse">
              <div className="w-12 h-12 bg-sky-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                🧠
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Sweety AI is evaluating your glucose patterns...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Applying American Diabetes Association (ADA) clinical guidelines
              </p>
            </div>
          ) : insights ? (
            <div className="space-y-4 text-sm">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Glycemic Evaluation:
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      badgeColorMap[insights.statusColor] || badgeColorMap.green
                    }`}
                  >
                    {insights.status}
                  </span>
                </div>
                {typeof insights.timeInRangePercent === 'number' &&
                  insights.timeInRangePercent > 0 && (
                    <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                      🎯 Time in Range: {insights.timeInRangePercent}%
                    </span>
                  )}
              </div>

              {/* Summary */}
              <p className="text-gray-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-gray-100">
                {insights.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patterns */}
                {insights.patterns?.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 text-xs flex items-center gap-1.5 mb-2.5">
                      <span>🔍</span> Detected Clinical Patterns
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {insights.patterns.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-sky-500 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations?.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-900 text-xs flex items-center gap-1.5 mb-2.5">
                      <span>💡</span> Actionable Recommendations
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Doctor Questions */}
              {insights.doctorQuestions?.length > 0 && (
                <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100">
                  <h4 className="font-semibold text-sky-900 text-xs flex items-center gap-1.5 mb-2">
                    <span>👨‍⚕️</span> Questions for Your Doctor
                  </h4>
                  <ul className="space-y-1 text-xs text-sky-800">
                    {insights.doctorQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Disclaimer */}
              <p className="text-[11px] text-gray-400 italic pt-1">
                ℹ️ {insights.disclaimer}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
