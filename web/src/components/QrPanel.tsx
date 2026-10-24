import { useState } from 'preact/hooks';
import { CopyButton } from './CopyButton';

const SIZES = [256, 512, 1024];

interface Props {
  linkId: number;
  slug: string;
  shortUrl: string;
}

export function QrPanel({ linkId, slug, shortUrl }: Props) {
  const [size, setSize] = useState(512);
  const base = `/api/links/${linkId}/qr`;

  return (
    <div class="card qr-panel">
      <h2 class="card-title">QR code</h2>
      <img src={`${base}?format=svg`} alt={`QR code for /${slug}`} width={160} height={160} />
      <div class="qr-actions">
        <select
          value={size}
          aria-label="PNG size"
          onChange={(e) => setSize(Number(e.currentTarget.value))}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s} × {s}
            </option>
          ))}
        </select>
        <a class="button" href={`${base}?format=png&size=${size}&download=1`}>
          PNG
        </a>
        <a class="button" href={`${base}?format=svg&download=1`}>
          SVG
        </a>
        <CopyButton text={shortUrl} label="Copy URL" />
      </div>
    </div>
  );
}
