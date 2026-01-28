'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    setColumnError('');
    const file = e.target.files?.[0];
    if (!file) {
      setIsUploading(false);
      return;
    }
    const { student_id, email, marks_obtained } = columnNames;
    if (!student_id || !email || !marks_obtained) {
      setColumnError('Please enter all column names.');
      setIsUploading(false);
      return;
    }
    try {
      let parsedData: Array<{ student_id: number; email: string; marks_obtained: number }> = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) throw new Error('No data found');
        const header = lines[0].split(',').map((h) => h.trim());
        const idxStudent = header.findIndex((h) => h.toLowerCase() === student_id.toLowerCase());
        const idxEmail = header.findIndex((h) => h.toLowerCase() === email.toLowerCase());
        const idxMarks = header.findIndex((h) => h.toLowerCase() === marks_obtained.toLowerCase());
        if (idxStudent === -1 || idxEmail === -1 || idxMarks === -1)
          throw new Error('Column not found');
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map((v) => v.trim());
          const sid = parseInt(row[idxStudent]);
          const em = row[idxEmail];
          const marks = parseFloat(row[idxMarks]);
          if (!isNaN(sid) && em && !isNaN(marks)) {
            parsedData.push({ student_id: sid, email: em, marks_obtained: marks });
          }
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        if (!jsonData || jsonData.length < 2) throw new Error('No data found');
        const header = jsonData[0].map((h: any) => String(h).trim());
        const idxStudent = header.findIndex((h) => h.toLowerCase() === student_id.toLowerCase());
        const idxEmail = header.findIndex((h) => h.toLowerCase() === email.toLowerCase());
        const idxMarks = header.findIndex((h) => h.toLowerCase() === marks_obtained.toLowerCase());
        if (idxStudent === -1 || idxEmail === -1 || idxMarks === -1)
          throw new Error('Column not found');
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const sid = parseInt(row[idxStudent]);
          const em = row[idxEmail];
          const marks = parseFloat(row[idxMarks]);
          if (!isNaN(sid) && em && !isNaN(marks)) {
            parsedData.push({ student_id: sid, email: em, marks_obtained: marks });
          }
        }
      } else {
        throw new Error('Only CSV and Excel files are supported.');
      }
      onFileSelect(parsedData);
      onClose();
    } catch (error: any) {
      setColumnError(error.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploading, setIsUploading] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Marks</h2>
          <h5>Upload the marks for {assessmentName}</h5>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-6 space-y-6">
          {/* Instructions Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>File Type:</strong> CSV (.csv) or Excel (.xlsx, .xls)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Maximum Size:</strong> 5 MB
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Column Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Student ID Column
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="e.g. RollNo or student_id"
                    value={columnNames.student_id}
                    onChange={(e) => setColumnNames({ ...columnNames, student_id: e.target.value })}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Column
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="e.g. Email id or email"
                    value={columnNames.email}
                    onChange={(e) => setColumnNames({ ...columnNames, email: e.target.value })}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Marks Column
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="e.g. marks_obtained or Marks"
                    value={columnNames.marks_obtained}
                    onChange={(e) =>
                      setColumnNames({ ...columnNames, marks_obtained: e.target.value })
                    }
                    disabled={isUploading}
                  />
                </div>
              </div>
              {columnError && <div className="text-xs text-red-600 mt-2">{columnError}</div>}
              <p className="text-xs text-gray-500 mt-2">
                * Enter the exact column names as in your file's header row.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Unenrolled Students
              </h3>
              <p className="text-sm text-yellow-800">
                If a student ID is in the file but not enrolled in the course, you'll be prompted to
                enroll them or skip their entry.
              </p>
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-12 h-12 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">Processing file...</span>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose()}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
