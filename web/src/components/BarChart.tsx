import { formatNumber } from '../format';

interface Point {
  date: string;
  clicks: number;
}

const WIDTH = 720;
const HEIGHT = 180;
const PAD_BOTTOM = 22;

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export function BarChart({ data }: { data: Point[] }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const slot = WIDTH / data.length;
  const bar = Math.max(1, slot * 0.7);
  const chartHeight = HEIGHT - PAD_BOTTOM;
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <svg
      class="bar-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Clicks per day"
      preserveAspectRatio="none"
    >
      <line x1="0" x2={WIDTH} y1={chartHeight} y2={chartHeight} class="axis" />
      {data.map((d, i) => {
        const h = (d.clicks / max) * (chartHeight - 8);
        const x = i * slot + (slot - bar) / 2;
        return (
          <g key={d.date}>
            <rect x={x} y={chartHeight - h} width={bar} height={h} rx="2" class="bar">
              <title>
                {shortDate(d.date)}: {formatNumber(d.clicks)} clicks
              </title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={i * slot + slot / 2} y={HEIGHT - 6} text-anchor="middle" class="tick">
                {shortDate(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
