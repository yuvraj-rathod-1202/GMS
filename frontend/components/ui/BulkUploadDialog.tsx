'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface BulkUploadDialogProps {
  assessmentName: string;
  onClose: () => void;
  onFileSelect: (
    parsedData: Array<{ student_id: number; email: string; marks_obtained: number }>
  ) => void;
}

export default function BulkUploadDialog({
  assessmentName,
  onClose,
  onFileSelect,
}: BulkUploadDialogProps) {
  const [columnNames, setColumnNames] = useState({ student_id: '', email: '', marks_obtained: '' });
  const [columnError, setColumnError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setColumnError('');
    setColumnNames({ student_id: '', email: '', marks_obtained: '' });
    resetFileInput();
    onClose();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    setColumnError('');

    const file = event.target.files?.[0];
    if (!file) {
      setIsUploading(false);
      return;
    }

    const { student_id, email, marks_obtained } = columnNames;
    if (!student_id || !email || !marks_obtained) {
      setColumnError('Please enter all column names.');
      setIsUploading(false);
      resetFileInput();
      return;
    }

    try {
      const parsedData: Array<{ student_id: number; email: string; marks_obtained: number }> = [];
      const validationErrors: string[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) throw new Error('No data found');

        const header = lines[0].split(',').map((value) => value.trim());
        const idxStudent = header.findIndex((value) => value.toLowerCase() === student_id.toLowerCase());
        const idxEmail = header.findIndex((value) => value.toLowerCase() === email.toLowerCase());
        const idxMarks = header.findIndex(
          (value) => value.toLowerCase() === marks_obtained.toLowerCase()
        );

        if (idxStudent === -1 || idxEmail === -1 || idxMarks === -1) {
          throw new Error('Column not found');
        }

        for (let index = 1; index < lines.length; index += 1) {
          const row = lines[index].split(',').map((value) => value.trim());
          const sidStr = row[idxStudent];
          const emailValue = row[idxEmail];
          const marksStr = row[idxMarks];

          const sid = parseInt(sidStr, 10);
          if (Number.isNaN(sid) || sidStr === '' || !/^\d+$/.test(sidStr.trim())) {
            validationErrors.push(
              `Row ${index + 1}: Student ID must be a valid number (found: "${sidStr}")`
            );
            continue;
          }

          if (!emailValue || !isValidEmail(emailValue)) {
            validationErrors.push(
              `Row ${index + 1}: Invalid email format (found: "${emailValue}")`
            );
            continue;
          }

          let marks = parseFloat(marksStr);
          if (Number.isNaN(marks) && marksStr !== '') {
            validationErrors.push(
              `Row ${index + 1}: Marks must be a valid number (found: "${marksStr}")`
            );
            continue;
          }

          if (marksStr === '') {
            marks = 0;
          }

          parsedData.push({ student_id: sid, email: emailValue, marks_obtained: marks });
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as Array<Array<unknown>>;

        if (!jsonData || jsonData.length < 2) throw new Error('No data found');

        const header = jsonData[0].map((value) => String(value).trim());
        const idxStudent = header.findIndex((value) => value.toLowerCase() === student_id.toLowerCase());
        const idxEmail = header.findIndex((value) => value.toLowerCase() === email.toLowerCase());
        const idxMarks = header.findIndex(
          (value) => value.toLowerCase() === marks_obtained.toLowerCase()
        );

        if (idxStudent === -1 || idxEmail === -1 || idxMarks === -1) {
          throw new Error('Column not found');
        }

        for (let index = 1; index < jsonData.length; index += 1) {
          const row = jsonData[index];
          const sidStr = String(row[idxStudent] || '').trim();
          const emailValue = String(row[idxEmail] || '').trim();
          const marksStr = String(row[idxMarks] || '').trim();

          const sid = parseInt(sidStr, 10);
          if (Number.isNaN(sid) || sidStr === '' || !/^\d+$/.test(sidStr)) {
            validationErrors.push(
              `Row ${index + 1}: Student ID must be a valid number (found: "${sidStr}")`
            );
            continue;
          }

          if (!emailValue || !isValidEmail(emailValue)) {
            validationErrors.push(
              `Row ${index + 1}: Invalid email format (found: "${emailValue}")`
            );
            continue;
          }

          let marks = parseFloat(marksStr);
          if (Number.isNaN(marks) && marksStr !== '') {
            validationErrors.push(
              `Row ${index + 1}: Marks must be a valid number (found: "${marksStr}")`
            );
            continue;
          }

          if (marksStr === '') {
            marks = 0;
          }

          parsedData.push({ student_id: sid, email: emailValue, marks_obtained: marks });
        }
      } else {
        throw new Error('Only CSV and Excel files are supported.');
      }

      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.slice(0, 5).join('\n');
        const remainingErrors =
          validationErrors.length > 5 ? `\n... and ${validationErrors.length - 5} more errors` : '';
        throw new Error(`Data validation failed:\n${errorMessage}${remainingErrors}`);
      }

      if (parsedData.length === 0) {
        throw new Error('No valid data found in the file');
      }

      onFileSelect(parsedData);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload error';
      setColumnError(message);
      resetFileInput();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open
      title="Bulk Upload Marks"
      description={`Upload the marks for ${assessmentName}`}
      onClose={handleClose}
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              File Requirements
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-400">•</span>
                <span>
                  <strong>File Type:</strong> CSV (.csv) or Excel (.xlsx, .xls)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-400">•</span>
                <span>
                  <strong>Maximum Size:</strong> 5 MB
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Column Mapping
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Student ID Column"
                value={columnNames.student_id}
                onChange={(event) => {
                  setColumnError('');
                  setColumnNames({ ...columnNames, student_id: event.target.value });
                }}
                placeholder="e.g. RollNo or student_id"
                disabled={isUploading}
              />
              <Input
                label="Email Column"
                value={columnNames.email}
                onChange={(event) => {
                  setColumnError('');
                  setColumnNames({ ...columnNames, email: event.target.value });
                }}
                placeholder="e.g. Email id or email"
                disabled={isUploading}
              />
              <Input
                label="Marks Column"
                value={columnNames.marks_obtained}
                onChange={(event) => {
                  setColumnError('');
                  setColumnNames({ ...columnNames, marks_obtained: event.target.value });
                }}
                placeholder="e.g. marks_obtained or Marks"
                disabled={isUploading}
              />
            </div>
            {columnError && <Alert variant="error" className="mt-3 whitespace-pre-wrap">{columnError}</Alert>}
            <p className="mt-2 text-xs text-gray-500">
              * Enter the exact column names as in your file&apos;s header row.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="file-upload"
            className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="mb-3 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span>
              </p>
              <p className="text-xs text-gray-500">CSV or Excel files (MAX. 5MB)</p>
            </div>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <svg className="h-5 w-5 animate-spin text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Processing file...</span>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
