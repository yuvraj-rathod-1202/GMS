'use client';

import React from 'react';
import Input from './Input';
import Select, { SelectOption } from './Select';
import Textarea from './Textarea';

type BaseField<T> = {
  name: keyof T & string;
  label: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
};

type TextField<T> = BaseField<T> & {
  type?: 'text' | 'email' | 'password' | 'number';
  min?: number;
  max?: number;
  step?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

type SelectField<T> = BaseField<T> & {
  type: 'select';
  options: SelectOption[];
};

type TextareaField<T> = BaseField<T> & {
  type: 'textarea';
  rows?: number;
};

export type FormFieldConfig<T> = TextField<T> | SelectField<T> | TextareaField<T>;

interface FormFieldsProps<T extends object> {
  fields: FormFieldConfig<T>[];
  values: T;
  errors?: Partial<Record<keyof T & string, string>>;
  onChange: (field: keyof T & string, value: string | number) => void;
  disabled?: boolean;
}

export default function FormFields<T extends object>({
  fields,
  values,
  errors,
  onChange,
  disabled = false,
}: FormFieldsProps<T>) {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = (values as Record<string, unknown>)[field.name];
        const error = errors?.[field.name];

        if (field.type === 'select') {
          return (
            <Select
              key={field.name}
              label={field.label}
              name={field.name}
              value={String(value ?? '')}
              onChange={(event) => onChange(field.name, event.target.value)}
              options={field.options}
              error={error}
              helperText={field.helperText}
              required={field.required}
              disabled={disabled}
              className={field.className}
            />
          );
        }

        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              name={field.name}
              value={String(value ?? '')}
              onChange={(event) => onChange(field.name, event.target.value)}
              placeholder={field.placeholder}
              error={error}
              helperText={field.helperText}
              required={field.required}
              disabled={disabled}
              rows={field.rows}
              className={field.className}
            />
          );
        }

        const inputType = field.type || 'text';

        return (
          <Input
            key={field.name}
            label={field.label}
            name={field.name}
            type={inputType}
              value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(event) => {
              if (inputType === 'number') {
                const numericValue = event.target.value === '' ? '' : Number(event.target.value);
                onChange(field.name, numericValue);
                return;
              }

              onChange(field.name, event.target.value);
            }}
            placeholder={field.placeholder}
            error={error}
            helperText={field.helperText}
            required={field.required}
            disabled={disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            inputMode={field.inputMode}
            className={field.className}
          />
        );
      })}
    </div>
  );
}