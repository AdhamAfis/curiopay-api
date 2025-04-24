import { RecurringType } from '@prisma/client';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function calculateNextProcessDate(
  baseDate: Date,
  type: RecurringType,
  frequency: number,
  dayOfMonth: number | null,
  dayOfWeek: number | null,
  monthOfYear: number | null,
): Date {
  const nextDate = new Date(baseDate);

  switch (type) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + frequency);
      break;

    case 'WEEKLY':
      if (typeof dayOfWeek === 'number' && dayOfWeek >= 0 && dayOfWeek <= 6) {
        const currentDayOfWeek = nextDate.getDay();
        let daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7;
        if (daysUntilNext === 0) {
          daysUntilNext = 7;
        }
        nextDate.setDate(nextDate.getDate() + (daysUntilNext + (7 * (frequency - 1))));
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * frequency));
      }
      break;

    case 'MONTHLY':
      if (typeof dayOfMonth === 'number' && dayOfMonth >= 1 && dayOfMonth <= 31) {
        nextDate.setMonth(nextDate.getMonth() + frequency);
        const maxDays = getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth());
        nextDate.setDate(Math.min(dayOfMonth, maxDays));
      } else {
        nextDate.setMonth(nextDate.getMonth() + frequency);
      }
      break;

    case 'YEARLY':
      if (typeof monthOfYear === 'number' && monthOfYear >= 1 && monthOfYear <= 12 && typeof dayOfMonth === 'number') {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
        nextDate.setMonth(monthOfYear - 1);
        const maxDays = getDaysInMonth(nextDate.getFullYear(), monthOfYear - 1);
        nextDate.setDate(Math.min(dayOfMonth, maxDays));
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
      }
      break;

    default:
      throw new Error('Invalid recurring type');
  }

  return nextDate;
} 