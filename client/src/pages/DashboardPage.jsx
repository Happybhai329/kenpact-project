import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReadingForm from '../components/ReadingForm';
import ReadingCard from '../components/ReadingCard';
import Navbar from '../components/Navbar';
import { ReadingCardSkeleton } from '../components/Skeleton';
import { getLocalTodayString, toDateInputString } from '../utils/date';

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const SLOT_KEYS = Object.keys(SLOT_LABELS);

export default function DashboardPage() {
  const [readings, setReadings] = useState([]);
  const [todayReadings, setTodayReadings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editReading, setEditReading] = useState(null);

  const todayStr = getLocalTodayString();

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, todayRes] = await Promise.all([
        api.get(`/readings?page=${page}&limit=10`),
        api.get(`/readings?date=${todayStr}&limit=4`),
      ]);
      setReadings(listRes.data.data.readings);
      setTotal(listRes.data.data.total);
      setPages(listRes.data.data.pages);
      setTodayReadings(todayRes.data.data.readings);
    } catch {
      toast.error('Failed to load readings');
    } finally {
      setLoading(false);
    }
  }, [page, todayStr]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/readings/${id}`);
      toast.success('Reading deleted');
      if (readings.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchReadings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEdit = (reading) => {
    setEditReading(reading);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditReading(null);
    fetchReadings();
  };

  const todayMap = new Map(
    todayReadings
      .filter((r) => toDateInputString(r.date) === todayStr)
      .map((r) => [r.slot, r.value])
  );

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Readings</h1>
            <p className="text-gray-500 text-sm mt-1">
              {total} total {total === 1 ? 'reading' : 'readings'} recorded
            </p>
          </div>
          <button
            onClick={() => {
              setEditReading(null);
              setShowForm((prev) => !prev || !!editReading);
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add Reading
          </button>
        </div>

        {/* Today's 4-slot summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Today&apos;s Check-ins ({todayMap.size}/4 slots)
            </h2>
            <span className="text-xs text-gray-400">{todayStr}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {SLOT_KEYS.map((slot) => {
              const val = todayMap.get(slot);
              return (
                <div
                  key={slot}
                  className={`rounded-lg px-3 py-2 border text-xs ${
                    val !== undefined
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <p className="font-medium truncate">{SLOT_LABELS[slot]}</p>
                  <p className="mt-0.5 font-semibold">
                    {val !== undefined ? `${val} mg/dl ✓` : 'Not logged'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <ReadingForm
              key={editReading ? `edit-${editReading.id}` : 'new'}
              reading={editReading}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditReading(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <ReadingCardSkeleton />
            <ReadingCardSkeleton />
            <ReadingCardSkeleton />
          </div>
        ) : readings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-700">
              No readings yet
            </h3>
            <p className="text-gray-500 mt-1">
              Add your first blood glucose reading to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Glucose Target Range Reference Legend */}
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-gray-500 font-medium">Glucose Ranges:</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low (&lt;70)
                </span>
                <span className="flex items-center gap-1.5 text-green-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Normal (70–140)
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Elevated (141–200)
                </span>
                <span className="flex items-center gap-1.5 text-red-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> High (&gt;200)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {readings.map((r) => (
                <ReadingCard
                  key={r.id}
                  reading={r}
                  slotLabels={SLOT_LABELS}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                      p === page
                        ? 'bg-sky-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-sky-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
