import { BiGroup } from 'react-icons/bi';

export function EmptyState({
  title,
  description,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionText,
  secondaryActionText,
  showSecondary = true,
}: {
  title: string;
  description: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryActionText: string;
  secondaryActionText?: string;
  showSecondary?: boolean;
}) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-gray-50">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <BiGroup className="text-3xl text-gray-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>

      <div className="flex gap-3">
        {showSecondary && onSecondaryAction && (
          <>
            <button
              onClick={onSecondaryAction}
              className="text-blue-600 font-medium hover:underline text-sm"
            >
              {secondaryActionText}
            </button>
            <span className="text-gray-300">|</span>
          </>
        )}
        <button
          onClick={onPrimaryAction}
          className="text-blue-600 font-medium hover:underline text-sm"
        >
          {primaryActionText}
        </button>
      </div>
    </div>
  );
}
