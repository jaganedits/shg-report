// ஸ்ரீ அன்னை மகளிர் சுய உதவிக்குழு - Shree Annai Magalir Suya Uthavi Kulu
// Data structure matching Excel columns exactly:
// B: # | C: உறுப்பினர் பெயர் | D: மாசசேமிப்பு | E: சேமிப்பு தொகை
// F: புதிய கடன் | G: பழைய கடன் | H: தவணைத் தொகை
// I: பழைய வட்டி | J: இம்மாத வட்டி | K: பாக்கி

export const GROUP_INFO = {
  nameTA: 'ஸ்ரீ அன்னை மகளிர் சுய உதவி குழு',
  nameEN: 'Shree Annai Magalir Suya Uthavi Kulu',
  type: 'Women Self Help Group (SHG)',
  startDate: '10.01.2019',
  monthlySaving: 500,
  totalMembers: 14,
  interestRate: 0.02,
};

// Real member names from "susila 2024 - Tamil Unicode.xlsx"
export const MEMBERS = [
  { id: 1,  name: 'M. Susila',           nameTA: 'M . சுசிலா' },
  { id: 2,  name: 'R. Anithatamilpriya',  nameTA: 'R . அனிதாதமிழ்பிரியா' },
  { id: 3,  name: 'K. Selvanayagi',       nameTA: 'K . செல்வநாயகி' },
  { id: 4,  name: 'K. Soundhari',         nameTA: 'K . சௌந்தரி' },
  { id: 5,  name: 'V. Vijaya',            nameTA: 'V . விஜயா' },
  { id: 6,  name: 'K. Pinky',             nameTA: 'k . பிங்கி' },
  { id: 7,  name: 'R. Mallika',           nameTA: 'R . மல்லிகா' },
  { id: 8,  name: 'V. Radhika',           nameTA: 'V . ராதிகா' },
  { id: 9,  name: 'P. Kalyani',           nameTA: 'P . கல்யாணி' },
  { id: 10, name: 'P. Lakshmi',           nameTA: 'P . லட்சுமி' },
  { id: 11, name: 'R. Vijayalakshmi',     nameTA: 'R . விஜயலட்சுமி' },
  { id: 12, name: 'K. Jayalakshmi',       nameTA: 'K . ஜெயலட்சுமி' },
  { id: 13, name: 'B. Tripurasundhari',   nameTA: 'B . திரிபுரசுந்தரி' },
  { id: 14, name: 'V. Srinidhi',          nameTA: 'v . ஸ்ரீநிதி' },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ── Auto-calculation formulas (matching Excel exactly) ──
// E (சேமிப்பு தொகை / Cumulative)     = PrevMonth.cumulative + currentSaving
// G (பழைய கடன் / Old Loan)            = PrevMonth.balance (carry-forward)
// I (பழைய வட்டி / Old Interest)       = PrevMonth.currentInterest (carry-forward)
// J (இம்மாத வட்டி / This Month Int.)  = newLoan × 0.02
// K (பாக்கி / Balance)                = newLoan + oldLoan - repayment

export const INTEREST_RATE = 0.02;

export function recalculateMonth(monthMembers, prevMonthMembers) {
  return monthMembers.map(mem => {
    const prevMem = prevMonthMembers?.find(p => p.memberId === mem.memberId);

    // E: Cumulative = prev cumulative + this month saving
    const prevCumulative = prevMem ? prevMem.cumulative : 0;
    const cumulative = prevCumulative + (mem.saving || 0);

    // G: Old Loan = previous month's balance (பாக்கி carry-forward)
    const oldLoan = prevMem ? (prevMem.balance || 0) : 0;

    // I: Old Interest = previous month's current interest (carry-forward)
    const oldInterest = prevMem ? (prevMem.currentInterest || 0) : 0;

    // J: This Month Interest = newLoan × 2%
    const currentInterest = Math.round((mem.loanTaken || 0) * INTEREST_RATE);

    // K: Balance = newLoan + oldLoan - repayment
    const balance = (mem.loanTaken || 0) + oldLoan - (mem.loanRepayment || 0);

    return {
      ...mem,
      cumulative,
      oldLoan,
      oldInterest,
      currentInterest,
      balance,
      // Keep legacy fields for backward compat
      interest: currentInterest,
      loanBalance: balance,
    };
  });
}

export function recalculateAllMonths(yearData) {
  const months = [...yearData.months];
  for (let i = 0; i < months.length; i++) {
    const prevMembers = i > 0 ? months[i - 1].members : null;
    const recalced = recalculateMonth(months[i].members, prevMembers);
    const totalSaving = recalced.reduce((s, m) => s + m.saving, 0);
    const totalCumulative = recalced.reduce((s, m) => s + m.cumulative, 0);
    months[i] = { ...months[i], members: recalced, totalSaving, totalCumulative };
  }
  return { ...yearData, months };
}

// Raw 2024 data from Excel (only user-input fields: saving, loanTaken, loanRepayment)
function buildSampleData() {
  const rawMonths = MONTHS.map((month, i) => {
    const isSavingMonth = i < 6; // Jan-June have savings
    return {
      month, monthIndex: i,
      members: MEMBERS.map(m => {
        const base = { memberId: m.id, saving: isSavingMonth ? 500 : 0, loanTaken: 0, loanRepayment: 0 };
        // May: Member 12 took loan 10000, repaid 1000
        if (i === 4 && m.id === 12) { base.loanTaken = 10000; base.loanRepayment = 1000; }
        // June: Member 8 took 18000, Member 13 took 7000
        if (i === 5 && m.id === 8) { base.loanTaken = 18000; }
        if (i === 5 && m.id === 13) { base.loanTaken = 7000; }
        return { ...base, cumulative: 0, oldLoan: 0, oldInterest: 0, currentInterest: 0, balance: 0, interest: 0, loanBalance: 0 };
      }),
      totalSaving: 0, totalCumulative: 0,
    };
  });

  return recalculateAllMonths({ year: 2024, months: rawMonths });
}

export const SAMPLE_YEAR_DATA = buildSampleData();

export function getYearSummary(yearData) {
  const totalSavings = yearData.months.reduce((s, m) => s + m.totalSaving, 0);
  const totalLoans = yearData.months.reduce((s, m) =>
    s + m.members.reduce((ms, mem) => ms + mem.loanTaken, 0), 0);
  const totalInterest = yearData.months.reduce((s, m) =>
    s + m.members.reduce((ms, mem) => ms + (mem.currentInterest || mem.interest || 0), 0), 0);
  const totalRepayments = yearData.months.reduce((s, m) =>
    s + m.members.reduce((ms, mem) => ms + mem.loanRepayment, 0), 0);
  const activeSavingMonths = yearData.months.filter(m => m.totalSaving > 0).length;
  const loansIssued = yearData.months.reduce((s, m) =>
    s + m.members.filter(mem => mem.loanTaken > 0).length, 0);

  return {
    totalSavings,
    totalLoans,
    totalInterest,
    totalRepayments,
    activeSavingMonths,
    loansIssued,
    finalCumulative: yearData.months[yearData.months.length - 1].totalCumulative,
  };
}
