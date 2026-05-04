'use client';

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  wrapperClassName?: string;
}

export default function Textarea({
  label,
  error,
  helperText,
  wrapperClassName = '',
  className = '',
  id,
  required,
  ...props
}: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <textarea
        id={textareaId}
        required={required}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-mms-blue focus:ring-2 focus:ring-mms-blue/20 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}