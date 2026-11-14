import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import AiInsightsCard from '../components/AiInsightsCard';
import {
  formatReadingDate,
  getLocalTodayString,
  shiftDays,
  shiftMonths,
} from '../utils/date';
import { StatCardSkeleton, ChartSkeleton } from '../components/Skeleton';
import { exportReadingsToCsv } from '../utils/exportCsv';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const SLOT_SHORT = {
  morning_fasting: 'Fasting',
  after_breakfast: 'Breakfast',
  after_lunch: 'Lunch',
  after_dinner: 'Dinner',
};

function StatCard({ label, value, unit = 'mg/dl', color = 'sky' }) {
  const colorMap = {
    sky: 'text-sky-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };
  if (value === null || value === undefined) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-gray-300 text-2xl font-bold mt-1">—</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
    </div>
  );
}

export default function ReportsPage() {
  const todayStr = getLocalTodayString();
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(todayStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const endpoint =
          reportType === 'daily'
            ? '/reports/daily'
            : reportType === 'mtd'
            ? '/reports/month-to-date'
            : '/reports/monthly';
        const res = await api.get(`${endpoint}?date=${date}`);
        setReport(res.data.data);
      } catch {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportType, date]);

  const chartData =
    report?.readings?.map((r) => ({
      label:
        reportType === 'daily'
          ? SLOT_SHORT[r.slot]
          : formatReadingDate(r.date, { day: 'numeric', month: 'short' }),
      fullLabel: `${formatReadingDate(r.date, {
        day: 'numeric',
        month: 'short',
      })} · ${SLOT_LABELS[r.slot]}`,
      value: r.value,
    })) || [];

  const rangeText = report
    ? report.startDate === report.endDate
      ? formatReadingDate(report.startDate)
      : `${formatReadingDate(report.startDate)} – ${formatReadingDate(
          report.endDate
        )}`
    : '';

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Analyze your glucose trends over daily, month-to-date, and monthly windows
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Report Mode Tabs */}
            <div className="flex gap-2">
              {[
                { key: 'daily', label: 'Daily' },
                { key: 'mtd', label: 'Month-to-Date' },
                { key: 'monthly', label: 'Monthly (Prev Month)' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setReportType(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === t.key
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Actions: Range badge + CSV export */}
            <div className="flex items-center gap-3">
              {rangeText && (
                <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                  {reportType === 'monthly' ? 'Previous Month: ' : 'Range: '}
                  <strong>{rangeText}</strong>
                </span>
              )}
              {report?.readings?.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    exportReadingsToCsv(
                      report.readings,
                      `sweety-report-${reportType}-${date}.csv`
                    )
                  }
                  className="text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Download report as CSV spreadsheet"
                >
                  <span>📥</span> Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Date Selector Row with Steppers and Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Date:</span>
              <button
                type="button"
                onClick={() => {
                  const newDate =
                    reportType === 'daily'
                      ? shiftDays(date || todayStr, -1)
                      : shiftMonths(date || todayStr, -1);
                  setDate(newDate);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition shadow-xs"
                title={reportType === 'daily' ? 'Previous day' : 'Previous month'}
                aria-label={reportType === 'daily' ? 'Previous day' : 'Previous month'}
              >
                ◀
              </button>

              <div className="relative">
                <input
                  type="date"
                  aria-label="Report reference date"
                  value={date}
                  max={todayStr}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  onChange={(e) => setDate(e.target.value || todayStr)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs font-medium cursor-pointer shadow-xs"
                />
              </div>

              <button
                type="button"
                disabled={date >= todayStr}
                onClick={() => {
                  const newDate =
                    reportType === 'daily'
                      ? shiftDays(date || todayStr, 1)
                      : shiftMonths(date || todayStr, 1);
                  setDate(newDate > todayStr ? todayStr : newDate);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title={reportType === 'daily' ? 'Next day' : 'Next month'}
                aria-label={reportType === 'daily' ? 'Next day' : 'Next month'}
              >
                ▶
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-gray-400 font-medium">Quick Select:</span>
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-2.5 py-1 rounded transition text-xs ${
                  date === todayStr
                    ? 'bg-sky-500 text-white font-medium shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDate(shiftDays(todayStr, -1))}
                className={`px-2.5 py-1 rounded transition text-xs ${
                  date === shiftDays(todayStr, -1)
                    ? 'bg-sky-500 text-white font-medium shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDate('2026-11-12')}
                className={`px-2.5 py-1 rounded transition text-xs flex items-center gap-1 ${
                  date === '2026-11-12'
                    ? 'bg-emerald-600 text-white font-medium shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Jump to seeded sample data date (12 Nov 2026)"
              >
                <span>📊</span> 12 Nov (Sample Data)
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <ChartSkeleton />
          </div>
        ) : report?.count === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-700">
              No readings found
            </h3>
            <p className="text-gray-500 mt-1">
              No glucose readings recorded for {rangeText || 'this period'}.
            </p>
          </div>
        ) : (
          report && (
            <>
              {/* AI Clinical Insights Engine */}
              <AiInsightsCard reportType={reportType} date={date} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Readings"
                  value={report.count}
                  unit="total"
                  color="sky"
                />
                <StatCard
                  label="Average"
                  value={
                    report.avg !== null ? Number(report.avg).toFixed(1) : null
                  }
                  color="orange"
                />
                <StatCard label="Highest" value={report.max} color="red" />
                <StatCard label="Lowest" value={report.min} color="green" />
              </div>

              {chartData.length > 1 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Glucose Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[40, 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullLabel || ''
                        }
                        formatter={(v) => [`${v} mg/dl`, 'Glucose']}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#3b82f6"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Low (70)',
                          position: 'insideTopRight',
                          fill: '#3b82f6',
                          fontSize: 10,
                        }}
                      />
                      <ReferenceLine
                        y={140}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Target (140)',
                          position: 'insideTopRight',
                          fill: '#d97706',
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#0ea5e9' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Reading Details
                  </h3>
                  <span className="text-xs text-gray-500">
                    {report.readings.length}{' '}
                    {report.readings.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {report.readings.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {SLOT_LABELS[r.slot]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatReadingDate(r.date, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          r.value < 70
                            ? 'text-blue-600'
                            : r.value <= 140
                            ? 'text-green-600'
                            : r.value <= 200
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {r.value} mg/dl
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
