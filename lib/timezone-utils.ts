import { utcToZonedTime, format } from 'date-fns-tz';

export function isWithinBusinessHours(timeZone: string): boolean {
  try {
    const now = new Date();
    const zonedTime = utcToZonedTime(now, timeZone);
    const hour = zonedTime.getHours();
    const day = zonedTime.getDay();

    if (day === 0 || day === 6) return false;

    return hour >= 9 && hour < 17;
  } catch {
    return true;
  }
}

export function getLocalTime(timeZone: string): string {
  try {
    const now = new Date();
    return format(utcToZonedTime(now, timeZone), 'yyyy-MM-dd HH:mm:ss zzz', { timeZone });
  } catch {
    return 'Unknown';
  }
}
