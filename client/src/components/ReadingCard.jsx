import { useState } from 'react';
import { formatReadingDate } from '../utils/date';

export default function ReadingCard({ reading, slotLabels, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getBadgeStyle = (value) => {
    if (value < 70) return { cls: 'text-blue-600 bg-blue-50', label: 'Low' };
    if (value <= 140) return { cls: 'text-green-600 bg-green-50', label: 'Normal' };
    if (value <= 200) return { cls: 'text-amber-600 bg-amber-50', label: 'Elevated' };
    return { cls: 'text-red-600 bg-red-50', label: 'High' };
  };

  const badge = getBadgeStyle(reading.value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`text-lg font-bold px-3 py-1.5 rounded-lg ${badge.cls}`}>
          {reading.value} <span className="text-xs font-normal">mg/dl</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{slotLabels[reading.slot]}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatReadingDate(reading.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {confirmDelete ? (
          <>
            <span className="text-xs text-gray-500 mr-1">Delete?</span>
            <button
              onClick={() => onDelete(reading.id)}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(reading)}
              className="text-sm text-sky-600 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
