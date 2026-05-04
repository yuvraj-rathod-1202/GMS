'use client';

import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  wrapperClassName?: string;
  options: SelectOption[];
}

export default function Select({
  label,
  error,
  helperText,
  wrapperClassName = '',
  className = '',
  options,
  id,
  required,
  children,
  ...props
}: SelectProps) {
  const selectId = id || props.name;

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-mms-blue focus:ring-2 focus:ring-mms-blue/20 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}