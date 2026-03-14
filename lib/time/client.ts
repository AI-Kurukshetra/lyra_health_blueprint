export interface DateTimeFormatConfig {
  includeDate?: boolean;
  includeSeconds?: boolean;
  includeTimeZoneName?: boolean;
}

export function getSystemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function formatDateTimeLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseDateTimeLocalInput(value: string): Date | null {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function formatInSystemTimeZone(
  input: string | Date,
  config: DateTimeFormatConfig = {},
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const systemTimeZone = getSystemTimeZone();
  const { includeDate = true, includeSeconds = false, includeTimeZoneName = true } = config;

  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: systemTimeZone,
    year: includeDate ? "numeric" : undefined,
    month: includeDate ? "short" : undefined,
    day: includeDate ? "2-digit" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    timeZoneName: includeTimeZoneName ? "short" : undefined,
  });

  return formatter.format(date);
}
