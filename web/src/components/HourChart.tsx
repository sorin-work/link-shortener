import { formatNumber } from '../format';

/** Shifts UTC hour buckets into the browser's timezone (whole-hour offsets). */
export function toLocalHours(utc: number[], offsetMinutes = new Date().getTimezoneOffset()) {
  const shift = Math.round(-offsetMinutes / 60);
  return utc.map((_, hour) => utc[(((hour - shift) % 24) + 24) % 24] ?? 0);
}

export function HourChart({ byHour }: { byHour: number[] }) {
  const hours = toLocalHours(byHour);
  const max = Math.max(1, ...hours);
  return (
    <div class="hour-chart" role="img" aria-label="Clicks by hour of day">
      {hours.map((n, hour) => (
        <div key={hour} class="hour" title={`${hour}:00 – ${formatNumber(n)} clicks`}>
          <span class="hour-bar" style={{ height: `${(n / max) * 100}%` }} />
          {hour % 6 === 0 && <span class="hour-label">{hour}h</span>}
        </div>
      ))}
    </div>
  );
}
