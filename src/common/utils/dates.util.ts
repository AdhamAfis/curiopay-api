type RecurringType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export function calculateNextProcessDate(
  baseDate: Date,
  type: RecurringType,
  frequency: number,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null,
  monthOfYear?: number | null,
): Date {
  const nextDate = new Date(baseDate);

  switch (type) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + frequency);
      break;

    case 'WEEKLY':
      if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) {
        // Calculate days until next occurrence
        const currentDayOfWeek = nextDate.getDay();
        let daysUntilNext = dayOfWeek - currentDayOfWeek;
        if (daysUntilNext <= 0) {
          daysUntilNext += 7;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilNext + (7 * (frequency - 1)));
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * frequency));
      }
      break;

    case 'MONTHLY':
      if (dayOfMonth !== null && dayOfMonth >= 1 && dayOfMonth <= 31) {
        // Set to specified day of month
        nextDate.setMonth(nextDate.getMonth() + frequency);
        nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
      } else {
        nextDate.setMonth(nextDate.getMonth() + frequency);
      }
      break;

    case 'YEARLY':
      if (monthOfYear !== null && monthOfYear >= 1 && monthOfYear <= 12 && dayOfMonth !== null) {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
        nextDate.setMonth(monthOfYear - 1);
        nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), monthOfYear - 1)));
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + frequency);
      }
      break;

    default:
      throw new Error('Invalid recurring type');
  }

  return nextDate;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
} 