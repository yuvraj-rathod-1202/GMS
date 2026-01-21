import React, { useState, useRef } from "react";

export default function GradeSheetButtons({ handleSave, handleDiscard, hasUnsavedChanges, isSaving, assessment, handlePublishToggle, isPublishing, handleBulkUpload } : {
    handleSave: () => void;
    handleDiscard: () => void;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    assessment?: any;
    handlePublishToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
    isPublishing: boolean;
    handleBulkUpload: (file: File) => Promise<void>;
}) {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await handleBulkUpload(file);
            setShowUploadDialog(false);
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    return (
        <>
            <div className="flex gap-3 mb-6 flex-wrap">
            <button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
                hasUnsavedChanges && !isSaving
                ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:shadow-md active:scale-95" 
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
            title={hasUnsavedChanges ? "Save all changes" : "No changes to save"}
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? "Saving..." : "Save Marks"}
            </button>

            {/* Discard Changes Button */}
            <button 
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
                hasUnsavedChanges
                ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:shadow-md active:scale-95" 
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
            title={hasUnsavedChanges ? "Discard all unsaved changes" : "No changes to discard"}
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Discard Changes
            </button>

            <button 
            onClick={() => setShowUploadDialog(true)}
            className="flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md active:scale-95 border border-gray-300"
            title="Upload marks from CSV/Excel file"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Bulk Upload
            </button>

            <button 
            onClick={handlePublishToggle}
            disabled={isPublishing}
            className="flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md active:scale-95 border border-gray-300"
            title="Make marks visible to students"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {assessment?.is_marks_published ? "Unpublish Marks" : "Publish Marks"}
            </button>
        </div>

        {/* Bulk Upload Dialog */}
        {showUploadDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Dialog Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Marks</h2>
                        <button 
                            onClick={() => setShowUploadDialog(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Dialog Content */}
                    <div className="p-6 space-y-6">
                        {/* Instructions Section */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    File Requirements
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400 mt-0.5">•</span>
                                        <span><strong>File Type:</strong> CSV (.csv) or Excel (.xlsx, .xls)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400 mt-0.5">•</span>
                                        <span><strong>Maximum Size:</strong> 5 MB</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Sample Format
                                </h3>
                                <div className="bg-white border border-gray-300 rounded p-3 font-mono text-xs">
                                    <div className="grid grid-cols-3 gap-2 font-semibold text-gray-700 pb-2 border-b border-gray-200">
                                        <div>student_id</div>
                                        <div>email</div>
                                        <div>marks_obtained</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-gray-600 pt-2">
                                        <div>24110293</div>
                                        <div>email@example.com</div>
                                        <div>25</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">* First row should contain column headers</p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Unenrolled Students
                                </h3>
                                <p className="text-sm text-yellow-800">
                                    If a student ID is in the file but not enrolled in the course, you'll be prompted to enroll them or skip their entry.
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
                                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Processing file...</span>
                            </div>
                        )}
                    </div>

                    {/* Dialog Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                        <button 
                            onClick={() => setShowUploadDialog(false)}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}