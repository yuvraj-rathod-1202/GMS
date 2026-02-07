import * as XLSX from 'xlsx';

export const parseCSV = (text: string): Array<{ student_id: number; email: string }> => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rollNoIdx = header.findIndex(
    (h) => h === 'rollno' || h === 'roll no' || h === 'roll_number' || h === 'roll number'
  );
  const emailIdx = header.findIndex((h) => h === 'email id' || h === 'email' || h === 'email_id');
  if (rollNoIdx === -1 || emailIdx === -1) return [];
  const data: Array<{ student_id: number; email: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map((v) => v.trim());
    const studentId = parseInt(values[rollNoIdx]);
    const email = values[emailIdx];
    if (!isNaN(studentId) && email) {
      data.push({
        student_id: studentId,
        email: email,
      });
    }
  }
  return data;
};

export const parseExcel = async (
  file: File
): Promise<Array<{ student_id: number; email: string }>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length < 2) return resolve([]);
        const header = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
        const rollNoIdx = header.findIndex(
          (h: string) =>
            h === 'rollno' || h === 'roll no' || h === 'roll_number' || h === 'roll number'
        );
        const emailIdx = header.findIndex(
          (h: string) => h === 'email id' || h === 'email' || h === 'email_id'
        );
        if (rollNoIdx === -1 || emailIdx === -1) return resolve([]);

        const parsedData: Array<{ student_id: number; email: string }> = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 2) continue;
          const studentId = parseInt(String(row[rollNoIdx]));
          const email = String(row[emailIdx]);
          if (!isNaN(studentId) && email) {
            parsedData.push({
              student_id: studentId,
              email: email,
            });
          }
        }

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};
