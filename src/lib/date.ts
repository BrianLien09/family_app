import { format } from 'date-fns';

export function getTodayDateString(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd');
}
