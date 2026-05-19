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
  changedCount?: number;
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
  changedCount = 0,
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
        <Button
          type="button"
          variant="secondary"
          onClick={onImportClick}
          className="flex items-center gap-2"
        >
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
      </div>
    </div>
  );
};
