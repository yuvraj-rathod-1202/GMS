import { InstructorCourseData } from '@/lib/store/courseDetail';
import { getAssessmentTypeLabel } from '@/lib/utils/assessmentlabel';
import ExcelJS from 'exceljs';

function getColLetter(colIndex: number): string {
  let letter = '';
  while (colIndex > 0) {
    let mod = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colIndex = Math.floor((colIndex - mod) / 26);
  }
  return letter;
}

export const exportGradeBookToExcel = async (
  instructorData: InstructorCourseData,
  courseCode: string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GradeBook Exporter';
  workbook.created = new Date();

  const sortedStudents =
    instructorData.CourseRoles?.students.sort((a, b) => a.user_id - b.user_id) || [];
  const assessmentCategories = instructorData.assessments
    .reduce((categories: number[], assessment) => {
      if (!categories.includes(assessment.assessment_type_id)) {
        categories.push(assessment.assessment_type_id);
      }
      return categories;
    }, [])
    .sort((a, b) => a - b);

  const MarksList = instructorData.assessmentMarks;
  const DefaulPolicyId = instructorData.policies.find((p) => p.is_default)?.id || -1;
  if (DefaulPolicyId === -1) {
    alert('Default policy not found. Cannot export grade book.');
    return;
  }
  const DefaulPolicy = instructorData.policies.find((p) => p.id === DefaulPolicyId);
  const categoryTotalColMap = new Map<number, string>();

  assessmentCategories.forEach((categoryId) => {
    const categoryLabel = getAssessmentTypeLabel(categoryId);

    const categoryAssessments = instructorData.assessments
      .filter((a) => a.assessment_type_id === categoryId)
      .sort((a, b) => {
        const dateA =
          typeof a.assessment_date === 'string'
            ? new Date(a.assessment_date).getTime()
            : a.assessment_date instanceof Date
              ? a.assessment_date.getTime()
              : Number(a.assessment_date);
        const dateB =
          typeof b.assessment_date === 'string'
            ? new Date(b.assessment_date).getTime()
            : b.assessment_date instanceof Date
              ? b.assessment_date.getTime()
              : Number(b.assessment_date);
        return dateA - dateB;
      });

    const sheet = workbook.addWorksheet(categoryLabel);

    const columns = [
      'RollNo',
      'Email Id',
      ...categoryAssessments.map((a) => `${a.name} (Max: ${a.max_marks})`),
      `Total Score`,
    ];

    sheet.addRow(columns);
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 30;
    for (let i = 3; i <= columns.length; i++) {
      sheet.getColumn(i).width = 15;
    }

    const TotalColumnIndex = columns.length;
    categoryTotalColMap.set(categoryId, getColLetter(TotalColumnIndex));

    sortedStudents.forEach((student, index) => {
      const rowIndex = index + 2;
      const rowData = [student.user_id, student.email];

      categoryAssessments.forEach((assessment) => {
        const score = MarksList[assessment.id]?.find(
          (m) => m.student_id === student.user_id
        )?.marks_obtained;
        rowData.push(score !== undefined ? score : 'N/A');
      });

      const studentPolicy =
        instructorData.policies.find(
          (p) => p.id === instructorData.studentPolicyMap[student.user_id]
        ) || DefaulPolicy;
      const componentRule = studentPolicy?.components.find(
        (c) => c.assessment_category_id === categoryId
      );

      let formula = '';

      const startCol = getColLetter(3);
      const endCol = getColLetter(2 + categoryAssessments.length);
      const range = `${startCol}${rowIndex}:${endCol}${rowIndex}`;

      if (!componentRule) {
        formula = `0`;
      } else {
        const type = componentRule.rules?.rule_type;

        switch (type) {
          case 'CUMULATIVE':
            const totalMarks = categoryAssessments.reduce((sum, a) => sum + a.max_marks, 0);
            formula = `IFERROR((SUM(${range}) / ${totalMarks}) * ${componentRule.weightage}, 0)`;
            break;

          case 'EQUAL_WEIGHTAGE':
            const parts = categoryAssessments.map((a, i) => {
              const col = getColLetter(3 + i);
              return `((${col}${rowIndex}/${a.max_marks})*100)`;
            });
            formula = `IFERROR(AVERAGE(${parts.join(',')}) * ${componentRule.weightage}/100, 0)`;
            break;

          case 'BEST_N':
            const n = componentRule.rules?.rule_params.n || 0;
            const kArr: string[] = Array.from({ length: n }, (_, i) => {
              return `LARGE((${range}), ${i + 1})`;
            });
            formula = `IFERROR(AVERAGE(${kArr.join(',')}) * ${componentRule.weightage}/100, 0)`;
            break;

          case 'CUSTOM':
            const params = componentRule.rules?.rule_params || {};
            const Arr: string[] = categoryAssessments.map((a, i) => {
              const col = getColLetter(3 + i);
              const weight = params[a.id] || 0;
              return `(${col}${rowIndex} * ${weight}/100)`;
            });
            formula = `IFERROR(${Arr.join(' + ')}, 0)`;
            break;
        }
      }
      const row = sheet.addRow([...rowData]);

      const totalCell = row.getCell(TotalColumnIndex);
      totalCell.value = { formula: formula };
    });
  });

  const mainSheet = workbook.addWorksheet('Main');

  const columns = [
    'RollNo',
    'Email Id',
    'Applied Policy',
    ...assessmentCategories.map((catId) => getAssessmentTypeLabel(catId)),
    'Total Score',
  ];
  mainSheet.addRow(columns);
  mainSheet.getRow(1).font = { bold: true };
  mainSheet.getColumn(1).width = 15;
  mainSheet.getColumn(2).width = 30;

  for (let i = 3; i <= columns.length; i++) {
    mainSheet.getColumn(i).width = 15;
  }

  sortedStudents.forEach((student, index) => {
    const rowIndex = index + 2;
    const rowData: any[] = [
      student.user_id,
      student.email,
      instructorData.policies.find((p) => p.id === instructorData.studentPolicyMap[student.user_id])
        ?.policy_name || DefaulPolicy?.policy_name,
    ];

    assessmentCategories.forEach((categoryId) => {
      const targetSheetName = getAssessmentTypeLabel(categoryId);
      const targetColumn = categoryTotalColMap.get(categoryId);

      const refFormula = `'${targetSheetName}'!${targetColumn}${rowIndex}`;
      rowData.push({ formula: refFormula });
    });

    const row = mainSheet.addRow([...rowData]);

    let FinalFormulaParts: string[] = [];

    assessmentCategories.forEach((categoryId, i) => {
      const colLetter = getColLetter(3 + i);
      const cellRef = `${colLetter}${rowIndex}`;
      FinalFormulaParts.push(`${cellRef}`);
    });

    const finalFormula = `IFERROR(SUM(${FinalFormulaParts.join(', ')}), 0)`;

    const totalCellIndex = columns.length;
    row.getCell(totalCellIndex).value = { formula: finalFormula };
    row.getCell(totalCellIndex).font = { bold: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${courseCode}_Gradebook.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};
