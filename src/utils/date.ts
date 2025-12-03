import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  addMonths,
  isValid,
} from "date-fns";
import { cs } from "date-fns/locale";

export function formatDate(date: string | Date, formatStr: string = "d. M. yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, formatStr, { locale: cs });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "d. M. yyyy HH:mm");
}

export function formatMonthYear(date: string | Date): string {
  return formatDate(date, "LLLL yyyy");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getCurrentMonth(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toISODate(startOfMonth(now)),
    end: toISODate(endOfMonth(now)),
  };
}

export function getCurrentYear(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toISODate(startOfYear(now)),
    end: toISODate(endOfYear(now)),
  };
}

export function getPreviousMonth(): { start: string; end: string } {
  const now = new Date();
  const prevMonth = subMonths(now, 1);
  return {
    start: toISODate(startOfMonth(prevMonth)),
    end: toISODate(endOfMonth(prevMonth)),
  };
}

export function getNextMonth(): { start: string; end: string } {
  const now = new Date();
  const nextMonth = addMonths(now, 1);
  return {
    start: toISODate(startOfMonth(nextMonth)),
    end: toISODate(endOfMonth(nextMonth)),
  };
}

export function getLastNMonths(n: number): { start: string; end: string } {
  const now = new Date();
  return {
    start: toISODate(startOfMonth(subMonths(now, n - 1))),
    end: toISODate(endOfMonth(now)),
  };
}

