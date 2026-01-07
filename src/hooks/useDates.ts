'use client';

import { useState, useEffect } from 'react';
import { DateItem } from '@/types';

export function useDates() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('family-dates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Simple sort by date
        parsed.sort((a: DateItem, b: DateItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDates(parsed);
      } catch (e) {
        console.error('Failed to parse dates', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveDates = (newDates: DateItem[]) => {
    newDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDates(newDates);
    localStorage.setItem('family-dates', JSON.stringify(newDates));
  };

  const addDate = (item: DateItem) => {
    saveDates([...dates, item]);
  };

  const deleteDate = (id: string) => {
    saveDates(dates.filter(d => d.id !== id));
  };

  return { dates, addDate, deleteDate, isLoaded };
}
