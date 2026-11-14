import { useState, useRef, useEffect } from 'react';
import {
  getLocalTodayString,
  toDateInputString,
  shiftDays,
} from '../utils/date';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerField({
  id = 'reading-date',
  label = 'Date',
  value,
  onChange,
  max,
  min,
  error,
  showPresets = true,
  className = '',
}) {
  const todayStr = getLocalTodayString();
  const maxDate = max;
  const currentDateStr = value ?? '';

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current selected year & month for calendar view
  const parseYearMonth = (str) => {
    if (str && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m] = str.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const [viewState, setViewState] = useState(() => parseYearMonth(currentDateStr));

  // Sync view when value changes
  useEffect(() => {
    if (currentDateStr) {
      setViewState(parseYearMonth(currentDateStr));
    }
  }, [currentDateStr]);

  // Close calendar on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handlePrevMonth = () => {
    setViewState((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewState((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Calendar days computation
  const daysInMonth = new Date(viewState.year, viewState.month + 1, 0).getDate();
  const firstDayIndex = new Date(viewState.year, viewState.month, 1).getDay();

  const handleDaySelect = (dayNum) => {
    const m = String(viewState.month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const selected = `${viewState.year}-${m}-${d}`;
    if (maxDate && selected > maxDate) return;
    if (min && selected < min) return;
    onChange(selected);
    setOpen(false);
  };

  const handleStepDay = (delta) => {
    const base = currentDateStr || todayStr;
    const next = shiftDays(base, delta);
    if (delta > 0 && maxDate && next > maxDate) return;
    if (delta < 0 && min && next < min) return;
    onChange(next);
  };

  const isNextDisabled = maxDate && currentDateStr ? currentDateStr >= maxDate : false;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Field Label Header */}
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <span className="text-[11px] text-sky-600 font-medium cursor-pointer hover:underline" onClick={() => setOpen((p) => !p)}>
          {open ? 'Close calendar ▲' : 'Open calendar 📅'}
        </span>
      </div>

      {/* Input Group with Steppers */}
      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => handleStepDay(-1)}
          className="px-2.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold transition shadow-xs flex-shrink-0"
          title="Previous day"
          aria-label="Previous day"
        >
          ◀
        </button>

        <div className="relative flex-1">
          <input
            id={id}
            type="date"
            value={currentDateStr}
            max={maxDate}
            min={min}
            onClick={() => setOpen(true)}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border cursor-pointer font-medium text-sm ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-sky-400'
            } focus:outline-none focus:ring-2 focus:ring-sky-400`}
          />
        </div>

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => handleStepDay(1)}
          className="px-2.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold transition shadow-xs flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next day"
          aria-label="Next day"
        >
          ▶
        </button>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="px-2.5 py-2 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm transition shadow-xs flex-shrink-0"
          title="Toggle interactive calendar picker"
          aria-label="Toggle interactive calendar picker"
        >
          📅
        </button>
      </div>

      {/* Quick 1-Click Presets */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
          <span className="text-[11px] text-gray-500 font-semibold">Quick pick:</span>
          <button
            type="button"
            onClick={() => onChange(todayStr)}
            className={`px-2 py-0.5 rounded transition text-[11px] font-medium ${
              currentDateStr === todayStr
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onChange(shiftDays(todayStr, -1))}
            className={`px-2 py-0.5 rounded transition text-[11px] font-medium ${
              currentDateStr === shiftDays(todayStr, -1)
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => onChange('2026-11-12')}
            className={`px-2 py-0.5 rounded transition text-[11px] font-medium flex items-center gap-1 ${
              currentDateStr === '2026-11-12'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Pick 12 Nov (Seeded dataset with 151 readings)"
          >
            <span>📊</span> 12 Nov
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Interactive Visual Calendar Dropdown Popup */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header with Month / Year and Steppers */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100 text-gray-600 font-bold text-xs"
              title="Previous Month"
            >
              ◀
            </button>
            <span className="text-xs font-semibold text-gray-800">
              {MONTH_NAMES[viewState.month]} {viewState.year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100 text-gray-600 font-bold text-xs"
              title="Next Month"
            >
              ▶
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-gray-400">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const m = String(viewState.month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateStr = `${viewState.year}-${m}-${d}`;
              const isSelected = dateStr === currentDateStr;
              const isToday = dateStr === todayStr;
              const isFuture = maxDate ? dateStr > maxDate : false;
              const isPastMin = min ? dateStr < min : false;
              const isDisabled = isFuture || isPastMin;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDaySelect(day)}
                  className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs transition ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isToday
                      ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-300 hover:bg-sky-100'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isDisabled ? 'Date in future' : dateStr}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              Select Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Done ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
