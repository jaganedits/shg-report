import * as XLSX from 'xlsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function parseShgExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const yearData = extractYearData(workbook);
        resolve(yearData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function extractYearData(workbook) {
  const months = [];
  const memberNames = [];

  workbook.SheetNames.forEach((sheetName, idx) => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (json.length < 4) return;

    const monthName = MONTH_NAMES[idx] || sheetName;
    const members = [];

    for (let r = 3; r < json.length - 2; r++) {
      const row = json[r];
      if (!row || !row[1]) continue;

      const memberId = typeof row[1] === 'number' ? row[1] : parseInt(row[1]);
      if (isNaN(memberId)) continue;

      const name = row[2] || `Member ${memberId}`;
      if (idx === 0) {
        memberNames.push({ id: memberId, name: String(name).trim() });
      }

      members.push({
        memberId,
        saving: toNum(row[3]),
        cumulative: toNum(row[4]),
        loanTaken: toNum(row[5]),
        loanRepayment: toNum(row[7]),
        interest: toNum(row[9]),
        loanBalance: toNum(row[10]),
      });
    }

    const totalRow = json[json.length - 1];
    months.push({
      month: monthName,
      monthIndex: idx,
      members,
      totalSaving: totalRow ? toNum(totalRow[3]) : members.reduce((s, m) => s + m.saving, 0),
      totalCumulative: totalRow ? toNum(totalRow[4]) : members.reduce((s, m) => s + m.cumulative, 0),
    });
  });

  return { months, memberNames };
}

function toNum(val) {
  if (val === null || val === undefined || val === '' || val === 'NaN') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}
