'use client';
import { BiUserPlus } from 'react-icons/bi';

interface PageHeaderProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}

export default function PageHeader({
  title,
  description,
  buttonText,
  onButtonClick,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600">{description}</p>
      </div>
      <button
        onClick={onButtonClick}
        className="max-w-40 flex items-center gap-2 px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
      >
        <BiUserPlus className="text-lg" />
        {buttonText}
      </button>
    </div>
  );
}
