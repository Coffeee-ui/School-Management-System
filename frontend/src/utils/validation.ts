export const CONTACT_NUMBER_REGEX = /^09\d{9}$/;
export const STUDENT_ID_REGEX = /^STU-\d{4}-\d{4}$/;
export const EMPLOYEE_ID_REGEX = /^EMP-\d{4}-\d{4}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function validateRequired(value: string, fieldName: string = 'This field'): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateContactNumber(value: string): string | null {
  if (!value) return 'Contact number is required';
  const trimmed = value.trim();
  if (!CONTACT_NUMBER_REGEX.test(trimmed)) {
    return 'Must be 11 digits starting with 09 (e.g. 09123456789)';
  }
  return null;
}

export function validateStudentId(value: string): string | null {
  if (!value) return 'Student ID is required';
  const trimmed = value.trim();
  if (!STUDENT_ID_REGEX.test(trimmed)) {
    return 'Student ID must follow format STU-YYYY-XXXX (e.g. STU-2024-0001)';
  }
  return null;
}

export function validateEmployeeId(value: string): string | null {
  if (!value) return 'Employee ID is required';
  const trimmed = value.trim();
  if (!EMPLOYEE_ID_REGEX.test(trimmed)) {
    return 'Employee ID must follow format EMP-YYYY-XXXX (e.g. EMP-2024-0001)';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return 'Email address is required';
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) return 'Email must not contain whitespace';
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed) || trimmed.includes('..')) {
    return 'Invalid email address format (e.g. user@gmail.com or user@school.edu)';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (!PASSWORD_REGEX.test(value)) {
    return 'Password must contain at least 8 characters, 1 uppercase letter, and 1 number';
  }
  return null;
}

export function validateCalendarDate(value: string): string | null {
  if (!value) return 'Date is required';
  if (!DATE_REGEX.test(value)) {
    return 'Date must follow YYYY-MM-DD format';
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isValid) {
    return 'Must be a real calendar date (e.g. 2026-02-30 is invalid)';
  }
  return null;
}

export function validateTime(value: string): string | null {
  if (!value) return 'Time is required';
  if (!TIME_REGEX.test(value.trim())) {
    return 'Time must follow 24-hour format HH:MM (00:00 - 23:59)';
  }
  return null;
}

export function validateTimeRange(start: string, end: string): string | null {
  const startErr = validateTime(start);
  if (startErr) return startErr;
  const endErr = validateTime(end);
  if (endErr) return endErr;

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (startMin >= endMin) {
    return 'Start time must occur before end time';
  }
  return null;
}

export function validateGrade(value: string | number): string | null {
  if (value === '' || value === null || value === undefined) return 'Grade is required';
  const num = Number(value);
  if (isNaN(num)) return 'Grade must be a number';
  if (num < 1.0 || num > 5.0) {
    return 'Grade must be between 1.00 and 5.00';
  }
  return null;
}

export function computeGradeRemarks(grade: number): string {
  if (grade <= 1.25) return 'Excellent';
  if (grade <= 1.75) return 'Very Good';
  if (grade <= 2.25) return 'Good';
  if (grade <= 2.75) return 'Satisfactory';
  if (grade <= 3.00) return 'Passing';
  if (grade <= 4.00) return 'Conditional';
  return 'Failed';
}
