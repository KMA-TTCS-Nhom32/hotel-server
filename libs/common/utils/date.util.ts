import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DATE_FORMAT = {
  DATE: 'DD-MM-YYYY',
  TIME: 'HH:mm',
} as const;

export function parseDate(dateString: string, format: string = DATE_FORMAT.DATE): Date {
  return dayjs(dateString, format, true).toDate();
}

export function formatDate(date: Date, format: string = DATE_FORMAT.DATE): string {
  return dayjs(date).format(format);
}

export function isValidDate(dateString: string, format: string = DATE_FORMAT.DATE): boolean {
  return dayjs(dateString, format, true).isValid();
}
