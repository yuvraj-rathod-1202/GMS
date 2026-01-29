import React from 'react';
import { BiSave, BiReset, BiCalculator, BiCloudUpload, BiSearch, BiCog } from 'react-icons/bi';

export const IGradeSheetButtons = ({
  searchTerm,
  setSearchTerm,
  onImportClick,
  onRecalculate,
  onSave,
  onDiscard,
  hasUnsavedChanges,
  isSaving,
  isRecalculating,
}: any) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
      {/* Left: Search & Filters */}
      <div className="relative w-full md:w-96">
        <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search student name, ID or email..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
        {/* The Missing Link: GLOBAL IMPORT */}
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm"
        >
          <BiCloudUpload className="text-xl" />
          <span>Import CSV</span>
        </button>

        {/* Recalculate */}
        <button
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <BiCalculator className="text-xl" />
          <span>{isRecalculating ? 'Calculating...' : 'Recalculate'}</span>
        </button>

        {/* Separator */}
        <div className="w-px h-10 bg-gray-300 mx-2 hidden md:block"></div>

        {/* State Actions */}
        <button
          onClick={onDiscard}
          disabled={!hasUnsavedChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            hasUnsavedChanges ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <BiReset className="text-xl" />
          Discard
        </button>

        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium shadow-sm transition-all ${
            hasUnsavedChanges
              ? 'bg-black text-white hover:bg-gray-800 hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <BiSave className="text-xl" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
