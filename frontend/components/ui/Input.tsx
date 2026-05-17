'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  wrapperClassName?: string;
  labelClassName?: string;
}

export default function Input({
  label,
  error,
  helperText,
  wrapperClassName = '',
  labelClassName = '',
  className = '',
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-gms-blue focus:ring-2 focus:ring-gms-blue/20 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
