import React from 'react';
import { BiCloudUpload, BiCalculator, BiReset, BiSave, BiSearch } from 'react-icons/bi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface IGradeSheetButtonsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onImportClick: () => void;
  onRecalculate: () => void;
  onSave: () => void;
  onDiscard: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isRecalculating: boolean;
}

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
}: IGradeSheetButtonsProps) => {
  return (
    <div className="mb-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row">
      <div className="relative w-full md:w-96">
        <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search student name, ID or email..."
          className="pl-10"
          wrapperClassName="!space-y-0"
        />
      </div>

      <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto">
        <Button type="button" variant="secondary" onClick={onImportClick} className="flex items-center gap-2">
          <BiCloudUpload className="text-xl" />
          <span>Import CSV</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onRecalculate}
          disabled={isRecalculating}
          title="Recalculate total marks based on the current grading policy and assessment marks"
          className="flex items-center gap-2"
        >
          <BiCalculator className="text-xl" />
          <span>{isRecalculating ? 'Calculating...' : 'Recalculate'}</span>
        </Button>

        <div className="hidden h-10 w-px bg-gray-300 md:block" />

        <Button
          type="button"
          variant="ghost"
          onClick={onDiscard}
          disabled={!hasUnsavedChanges}
          className={hasUnsavedChanges ? 'text-red-600 hover:bg-red-50' : 'text-gray-400'}
        >
          <BiReset className="text-xl" />
          Discard
        </Button>

        <Button
          type="button"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center gap-2 px-6 ${hasUnsavedChanges ? '' : 'bg-gray-100 text-gray-400 hover:bg-gray-100'}`}
        >
          <BiSave className="text-xl" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
