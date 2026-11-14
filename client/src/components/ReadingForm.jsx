import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  getLocalTodayString,
  toDateInputString,
  shiftDays,
} from '../utils/date';

const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export default function ReadingForm({ reading, onSuccess, onCancel }) {
  const isEdit = !!reading;
  const todayStr = getLocalTodayString();
  const yesterdayStr = shiftDays(todayStr, -1);
  const twoDaysAgoStr = shiftDays(todayStr, -2);

  const [form, setForm] = useState({
    date: reading ? toDateInputString(reading.date) : todayStr,
    slot: reading?.slot || 'morning_fasting',
    value: reading?.value !== undefined ? String(reading.value) : '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    const trimmedVal = String(form.value ?? '').trim();

    if (!trimmedVal) {
      e.value = 'Please enter a glucose value.';
    } else {
      const val = Number(trimmedVal);
      if (
        !/^-?\d+$/.test(trimmedVal) ||
        !Number.isInteger(val) ||
        val < 40 ||
        val > 600
      ) {
        e.value = 'Value must be between 40 and 600 mg/dl.';
      }
    }

    if (!form.date) {
      e.date = 'Please select a date.';
    } else if (form.date > getLocalTodayString()) {
      e.date = 'Date cannot be in the future.';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        date: form.date,
        slot: form.slot,
        value: Number(String(form.value).trim()),
      };
      if (isEdit) {
        await api.put(`/readings/${reading.id}`, payload);
        toast.success('Reading updated!');
      } else {
        await api.post('/readings', payload);
        toast.success('Reading added!');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-sky-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {isEdit ? 'Edit Reading' : 'Add New Reading'}
      </h2>
      {errors.api && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {errors.api}
        </div>
      )}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="reading-date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <span className="text-[11px] text-gray-400">Click to open calendar</span>
          </div>
          <div className="relative">
            <input
              id="reading-date"
              type="date"
              value={form.date}
              max={todayStr}
              onClick={(e) => {
                try {
                  e.target.showPicker?.();
                } catch {}
              }}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border cursor-pointer ${
                errors.date ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-sky-400'
              } focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm`}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-[11px] text-gray-400 font-medium">Quick:</span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, date: todayStr }))}
              className={`px-2 py-0.5 rounded transition text-[11px] ${
                form.date === todayStr
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, date: yesterdayStr }))}
              className={`px-2 py-0.5 rounded transition text-[11px] ${
                form.date === yesterdayStr
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, date: twoDaysAgoStr }))}
              className={`px-2 py-0.5 rounded transition text-[11px] ${
                form.date === twoDaysAgoStr
                  ? 'bg-sky-600 text-white font-medium shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2d ago
            </button>
          </div>
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="reading-slot"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time Slot
          </label>
          <select
            id="reading-slot"
            value={form.slot}
            onChange={(e) => setForm((p) => ({ ...p, slot: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="reading-value"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Value (mg/dl)
          </label>
          <input
            id="reading-value"
            type="number"
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
            placeholder="e.g. 95"
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.value ? 'border-red-400 bg-red-50' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-sky-400`}
          />
          {errors.value && (
            <p className="text-red-500 text-xs mt-1">{errors.value}</p>
          )}
        </div>

        <div className="md:col-span-3 flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Reading'}
          </button>
        </div>
      </form>
    </div>
  );
}
