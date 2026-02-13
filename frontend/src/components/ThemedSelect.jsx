import React, { useEffect, useMemo, useRef, useState } from 'react';

function normalizeOptions(options) {
  return (options || []).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: String(opt), label: String(opt) };
    }
    return {
      value: String(opt?.value ?? ''),
      label: String(opt?.label ?? opt?.value ?? ''),
    };
  });
}

export default function ThemedSelect({
  value,
  onChange,
  options = [],
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const selectedLabel =
    normalizedOptions.find((o) => o.value === String(value ?? ''))?.label || '';

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const emitChange = (nextValue) => {
    if (typeof onChange === 'function') {
      onChange({ target: { value: nextValue } });
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full p-3 border rounded-lg text-left flex items-center justify-between bg-emerald-50 border-emerald-400 text-emerald-900 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        <span>{selectedLabel}</span>
        <span className={`text-emerald-700 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-emerald-300 bg-emerald-50 shadow-lg">
          {normalizedOptions.map((opt) => {
            const isSelected = String(value ?? '') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'bg-emerald-800 text-emerald-50'
                    : 'text-emerald-900 hover:bg-emerald-700 hover:text-emerald-50'
                }`}
                onClick={() => {
                  emitChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
