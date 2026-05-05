'use client';

import React, { useRef, useState } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface BulkEnrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export default function BulkEnrollDialog({ isOpen, onClose, onUpload }: BulkEnrollDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open
      title="Bulk Enroll Students"
      onClose={handleClose}
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
            <BiInfoCircle className="text-gray-600" />
            File Requirements
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-400">•</span>
              <span>
                Upload a <strong>Student list</strong> file exported from the <strong>IMS</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-400">•</span>
              <span>File type should be .xlsx or .xls</span>
            </li>
          </ul>
        </div>

        <div>
          <label
            htmlFor="file-upload-enroll"
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
              id="file-upload-enroll"
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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
