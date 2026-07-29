import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { RestockItem, RestockPurchaseRecord } from '@/types';

const MIN_INTERVAL_DAYS = 1;

export interface RestockPrediction {
  averageIntervalDays: number | null;
  effectiveIntervalDays: number;
  predictedDueDate: string;
  daysUntilDue: number;
  isDue: boolean;
  reminderAlreadySent: boolean;
}

export function getTodayDateString(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd');
}

export function normalizePurchaseHistory(
  purchaseHistory: RestockPurchaseRecord[],
  lastPurchasedOn: string,
): RestockPurchaseRecord[] {
  const uniqueDates = Array.from(
    new Set(
      [
        ...purchaseHistory.map((record) => record.purchasedOn),
        lastPurchasedOn,
      ].filter((date) => Boolean(date)),
    ),
  );

  return uniqueDates
    .sort((left, right) => parseISO(left).getTime() - parseISO(right).getTime())
    .map((purchasedOn) => ({ purchasedOn }));
}

function getAverageIntervalDays(purchaseDates: string[]): number | null {
  if (purchaseDates.length < 2) {
    return null;
  }

  const intervals = purchaseDates
    .slice(1)
    .map((date, index) => differenceInCalendarDays(parseISO(date), parseISO(purchaseDates[index])))
    .filter((days) => days > 0);

  if (intervals.length === 0) {
    return null;
  }

  const total = intervals.reduce((sum, days) => sum + days, 0);
  return Math.max(MIN_INTERVAL_DAYS, Math.round(total / intervals.length));
}

export function getRestockPrediction(
  item: RestockItem,
  referenceDate: Date = new Date(),
): RestockPrediction {
  const purchaseHistory = normalizePurchaseHistory(item.purchaseHistory, item.lastPurchasedOn);
  const purchaseDates = purchaseHistory.map((record) => record.purchasedOn);
  const averageIntervalDays = getAverageIntervalDays(purchaseDates);
  const targetIntervalDays = Math.max(MIN_INTERVAL_DAYS, item.targetIntervalDays);

  const effectiveIntervalDays = averageIntervalDays === null
    ? targetIntervalDays
    : Math.max(
        MIN_INTERVAL_DAYS,
        Math.round((averageIntervalDays * 0.7) + (targetIntervalDays * 0.3)),
      );

  const predictedDueDate = format(
    addDays(parseISO(item.lastPurchasedOn), effectiveIntervalDays),
    'yyyy-MM-dd',
  );
  const daysUntilDue = differenceInCalendarDays(parseISO(predictedDueDate), referenceDate);

  return {
    averageIntervalDays,
    effectiveIntervalDays,
    predictedDueDate,
    daysUntilDue,
    isDue: daysUntilDue <= 0,
    reminderAlreadySent: item.lastNotifiedDueOn === predictedDueDate,
  };
}
