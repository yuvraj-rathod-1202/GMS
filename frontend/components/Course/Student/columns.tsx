export default function GetColumns(handleShowDetails: (assessmentId: number) => void) {
  return [
    { header: 'Assessment Name', key: 'assessment_name' },
    {
      header: 'Date',
      key: 'assessment_date',
      render: (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
    },
    {
      header: 'Score',
      key: 'marks_obtained',
      render: (score: number, row: any) => `${score}/${row.max_marks}`,
    },
    {
      header: '',
      key: 'action',
      render: (_: any, row: any) => (
        <button
          onClick={() => handleShowDetails(row.assessment_id)}
          className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Detail
        </button>
      ),
    },
  ];
}
