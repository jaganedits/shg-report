const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export const MAX_AMOUNT = 10000000;
export const USER_STATUSES = ['active', 'disabled'];
export const USER_ROLES = ['admin', 'member'];

function toStringValue(value) {
  return typeof value === 'string' ? value : String(value ?? '');
}

export function normalizeUsername(value) {
  return toStringValue(value).trim().toLowerCase();
}

export function assertValidUsername(value) {
  const username = normalizeUsername(value);
  if (!USERNAME_REGEX.test(username)) {
    throw new Error('Username must be 3-30 chars and contain only lowercase letters, numbers, ., _, -');
  }
  return username;
}

export function assertStrongPassword(value) {
  const password = toStringValue(value);
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error('Password must be 8-64 chars and include at least one letter and one number');
  }
  return password;
}

export function assertValidPersonName(value, fieldName = 'Name', { optional = false, max = 120 } = {}) {
  const trimmed = toStringValue(value).trim();
  if (!trimmed) {
    if (optional) return '';
    throw new Error(`${fieldName} is required`);
  }
  if (trimmed.length > max) {
    throw new Error(`${fieldName} must be at most ${max} characters`);
  }
  const hasControlChar = Array.from(trimmed).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (hasControlChar) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return trimmed;
}

export function assertValidYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1901 || year > 2099) {
    throw new Error('Year must be an integer between 1901 and 2099');
  }
  return year;
}

export function assertNonNegativeAmount(value, fieldName = 'Amount', { max = MAX_AMOUNT } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new Error(`${fieldName} must be a finite number`);
  }
  if (amount < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
  if (amount > max) {
    throw new Error(`${fieldName} exceeds the allowed limit (${max})`);
  }
  return amount;
}

export function assertValidUserRole(value) {
  const role = toStringValue(value).trim().toLowerCase();
  if (!USER_ROLES.includes(role)) {
    throw new Error('Role must be either "admin" or "member"');
  }
  return role;
}

export function assertValidUserStatus(value) {
  const status = toStringValue(value).trim().toLowerCase();
  if (!USER_STATUSES.includes(status)) {
    throw new Error('Status must be either "active" or "disabled"');
  }
  return status;
}

export function assertMemberRecord(member) {
  if (!member || typeof member !== 'object') {
    throw new Error('Invalid member record');
  }

  const memberId = Number(member.memberId);
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw new Error('memberId must be a positive integer');
  }

  return {
    ...member,
    memberId,
    saving: assertNonNegativeAmount(member.saving ?? 0, 'Monthly saving'),
    cumulative: assertNonNegativeAmount(member.cumulative ?? 0, 'Cumulative'),
    loanTaken: assertNonNegativeAmount(member.loanTaken ?? 0, 'New loan'),
    loanRepayment: assertNonNegativeAmount(member.loanRepayment ?? 0, 'Repayment'),
    oldLoan: assertNonNegativeAmount(member.oldLoan ?? 0, 'Old loan'),
    oldInterest: assertNonNegativeAmount(member.oldInterest ?? 0, 'Old interest'),
    currentInterest: assertNonNegativeAmount(member.currentInterest ?? 0, 'Current interest'),
    balance: assertNonNegativeAmount(member.balance ?? 0, 'Balance'),
    interest: assertNonNegativeAmount(member.interest ?? 0, 'Interest'),
    loanBalance: assertNonNegativeAmount(member.loanBalance ?? 0, 'Loan balance'),
  };
}

export function assertYearDataRecord(year, yearData) {
  const safeYear = assertValidYear(year);
  if (!yearData || typeof yearData !== 'object') {
    throw new Error('Year data payload is required');
  }
  if (!Array.isArray(yearData.months) || yearData.months.length === 0) {
    throw new Error('Year data must include at least one month');
  }

  const months = yearData.months.map((month, index) => {
    if (!month || typeof month !== 'object') {
      throw new Error(`Month record at index ${index} is invalid`);
    }
    if (!Array.isArray(month.members)) {
      throw new Error(`Month "${month.month || index}" is missing members`);
    }

    const members = month.members.map(assertMemberRecord);
    return {
      ...month,
      members,
      totalSaving: assertNonNegativeAmount(month.totalSaving ?? 0, 'Month total saving'),
      totalCumulative: assertNonNegativeAmount(month.totalCumulative ?? 0, 'Month total cumulative'),
    };
  });

  return { ...yearData, year: safeYear, months };
}

export function isPermissionDeniedError(error) {
  const code = toStringValue(error?.code).toLowerCase();
  const message = toStringValue(error?.message).toLowerCase();
  return code.includes('permission-denied') || message.includes('permission') || message.includes('insufficient permissions');
}
