export interface AssessmentCategory {
  id: number;
  type: string;
}

export const getAssessmentTypeLabel = (
  typeId: number,
  categories?: AssessmentCategory[]
): string => {
  if (categories && categories.length > 0) {
    const found = categories.find((c) => c.id === typeId);
    if (found) return found.type;
  }
  const types: { [key: number]: string } = {
    1: 'Quiz',
    2: 'Assignment',
    3: 'Midsem',
    4: 'EndSem',
    5: 'Project',
    6: 'Attendance',
    7: 'Lab',
    8: 'Other',
  };
  return types[typeId] || `Type ${typeId}`;
};
