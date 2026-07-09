'use client';

import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export default function Checkbox({
  label,
  helperText,
  wrapperClassName = '',
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || props.name;

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
      >
        <input
          id={checkboxId}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-gms-blue focus:ring-2 focus:ring-gms-blue/20 ${className}`}
          {...props}
        />
        <span className="space-y-0.5">
          {label && <span className="block font-medium text-gray-900">{label}</span>}
          {helperText && <span className="block text-xs text-gray-500">{helperText}</span>}
        </span>
      </label>
    </div>
  );
}
