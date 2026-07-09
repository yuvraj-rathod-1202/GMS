'use client';

import React from 'react';

interface SwitchProps {
  label: string;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export default function Switch({
  label,
  helperText,
  checked,
  onChange,
  disabled = false,
  id,
}: SwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-50">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id}
          className={`text-sm font-semibold transition-colors ${
            disabled ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {label}
        </label>
        {helperText && (
          <p
            className={`text-xs transition-colors ${disabled ? 'text-gray-300' : 'text-gms-blue'}`}
          >
            {helperText}
          </p>
        )}
      </div>

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gms-blue/20 focus:ring-offset-2 ${
          checked ? 'bg-black' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
