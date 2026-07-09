'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface Assessment {
  is_marks_published?: boolean;
}

export default function GradeSheetButtons({
  handleSave,
  handleDiscard,
  hasUnsavedChanges,
  isSaving,
  assessment,
  handlePublishToggle,
  isPublishing,
  handleBulkUpload,
}: {
  handleSave: () => void;
  handleDiscard: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  assessment?: Assessment;
  handlePublishToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isPublishing: boolean;
  handleBulkUpload: (file: File) => Promise<void>;
}) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [columnNames, setColumnNames] = useState({ student_id: '', email: '', marks_obtained: '' });
  const [columnError, setColumnError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { student_id, email, marks_obtained } = columnNames;
    if (!student_id || !email || !marks_obtained) {
      setColumnError('Please enter all column names.');
      return;
    }
    setColumnError('');

    setIsUploading(true);
    try {
      const parsedData: Array<{ student_id: number; email: string; marks_obtained: number }> = [];
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
          const sid = parseInt(row[idxStudent], 10);
          const em = row[idxEmail];
          const marks = parseFloat(row[idxMarks]);
          if (!Number.isNaN(sid) && em && !Number.isNaN(marks)) {
            parsedData.push({ student_id: sid, email: em, marks_obtained: marks });
          }
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as Array<
          Array<unknown>
        >;
        if (!jsonData || jsonData.length < 2) throw new Error('No data found');
        const header = jsonData[0].map((h: unknown) => String(h).trim());
        const idxStudent = header.findIndex((h) => h.toLowerCase() === student_id.toLowerCase());
        const idxEmail = header.findIndex((h) => h.toLowerCase() === email.toLowerCase());
        const idxMarks = header.findIndex((h) => h.toLowerCase() === marks_obtained.toLowerCase());
        if (idxStudent === -1 || idxEmail === -1 || idxMarks === -1)
          throw new Error('Column not found');
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const sid = parseInt(String(row[idxStudent]), 10);
          const em = String(row[idxEmail] || '').trim();
          const marks = parseFloat(String(row[idxMarks]));
          if (!Number.isNaN(sid) && em && !Number.isNaN(marks)) {
            parsedData.push({ student_id: sid, email: em, marks_obtained: marks });
          }
        }
      } else {
        throw new Error('Only CSV and Excel files are supported.');
      }
      await handleBulkUpload(file);
      setShowUploadDialog(false);
      setColumnNames({ student_id: '', email: '', marks_obtained: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload error';
      setColumnError(message);
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Upload error:', error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowUploadDialog(false);
    setColumnError('');
    setColumnNames({ student_id: '', email: '', marks_obtained: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          title={hasUnsavedChanges ? 'Save all changes' : 'No changes to save'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? 'Saving...' : 'Save Marks'}
        </Button>

        <Button
          onClick={handleDiscard}
          disabled={!hasUnsavedChanges}
          variant="secondary"
          title={hasUnsavedChanges ? 'Discard all unsaved changes' : 'No changes to discard'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Discard Changes
        </Button>

        <Button
          onClick={() => setShowUploadDialog(true)}
          variant="secondary"
          title="Upload marks from CSV/Excel file"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Bulk Upload
        </Button>

        <Button
          onClick={handlePublishToggle}
          disabled={isPublishing}
          variant="secondary"
          title="Make marks visible to students"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {assessment?.is_marks_published ? 'Unpublish Marks' : 'Publish Marks'}
        </Button>
      </div>

      {/* Bulk Upload Modal */}
      <Modal
        open={showUploadDialog}
        title="Bulk Upload Marks"
        description="Upload marks from a CSV or Excel file"
        onClose={handleCloseDialog}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
                <svg
                  className="h-5 w-5 text-gray-600"
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
                <svg
                  className="h-5 w-5 text-gray-600"
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
              {columnError && (
                <Alert variant="error" className="mt-3 whitespace-pre-wrap">
                  {columnError}
                </Alert>
              )}
              <p className="mt-2 text-xs text-gray-500">
                * Enter the exact column names as in your file&apos;s header row.
              </p>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-yellow-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                If a student ID is in the file but not enrolled in the course, you&apos;ll be
                prompted to enroll them or skip their entry.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="file-upload"
              className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="mb-3 h-12 w-12 text-gray-400"
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
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <svg
                className="h-5 w-5 animate-spin text-gray-600"
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
                />
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
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseDialog}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
