export const CONTACT_NUMBER_REGEX = /^09\d{9}$/;
export const STUDENT_ID_REGEX = /^STU-\d{4}-\d{4}$/;
export const EMPLOYEE_ID_REGEX = /^EMP-\d{4}-\d{4}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isValidContactNumber(contact: string): boolean {
  if (typeof contact !== 'string') return false;
  return CONTACT_NUMBER_REGEX.test(contact.trim());
}

export function isValidStudentId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return STUDENT_ID_REGEX.test(id.trim());
}

export function isValidEmployeeId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return EMPLOYEE_ID_REGEX.test(id.trim());
}

export function isValidPassword(password: string): boolean {
  if (typeof password !== 'string') return false;
  return PASSWORD_REGEX.test(password);
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (/\s/.test(trimmed)) return false;
  // Valid email pattern supporting Gmail, .edu, and general institutional domains
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  // Disallow consecutive dots or invalid domain characters
  if (trimmed.includes('..')) return false;
  return true;
}

export function isValidCalendarDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!DATE_REGEX.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // JavaScript Date handles month 0-indexed
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidTime(timeStr: string): boolean {
  if (typeof timeStr !== 'string') return false;
  return TIME_REGEX.test(timeStr.trim());
}

export function isStartTimeBeforeEndTime(start: string, end: string): boolean {
  if (!isValidTime(start) || !isValidTime(end)) return false;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return startMinutes < endMinutes;
}

export function isValidGrade(grade: number): boolean {
  if (typeof grade !== 'number' || isNaN(grade)) return false;
  return grade >= 1.0 && grade <= 5.0;
}

export function getGradeRemarks(grade: number): string {
  if (grade <= 1.25) return 'Excellent';
  if (grade <= 1.75) return 'Very Good';
  if (grade <= 2.25) return 'Good';
  if (grade <= 2.75) return 'Satisfactory';
  if (grade <= 3.00) return 'Passing';
  if (grade <= 4.00) return 'Conditional';
  return 'Failed';
}
