import { useState } from 'preact/hooks';
import { buildUtmUrl, readUtm, type UtmField, type UtmParams } from '../utm';

const LABELS: Record<UtmField, { label: string; placeholder: string }> = {
  source: { label: 'Source', placeholder: 'newsletter' },
  medium: { label: 'Medium', placeholder: 'email' },
  campaign: { label: 'Campaign', placeholder: 'spring_sale' },
  term: { label: 'Term', placeholder: 'running shoes' },
  content: { label: 'Content', placeholder: 'header_button' },
};

interface Props {
  url: string;
  onApply: (url: string) => void;
}

export function UtmBuilder({ url, onApply }: Props) {
  const [params, setParams] = useState<UtmParams>(() => readUtm(url));
  const preview = url ? buildUtmUrl(url, params) : '';

  return (
    <fieldset class="utm">
      <legend>Campaign tracking (UTM)</legend>
      <div class="utm-grid">
        {(Object.keys(LABELS) as UtmField[]).map((field) => (
          <label key={field}>
            {LABELS[field].label}
            <input
              placeholder={LABELS[field].placeholder}
              value={params[field] ?? ''}
              onInput={(e) => setParams({ ...params, [field]: e.currentTarget.value })}
            />
          </label>
        ))}
      </div>
      {preview && preview !== url && (
        <div class="utm-preview">
          <code class="truncate">{preview}</code>
          <button type="button" class="small" onClick={() => onApply(preview)}>
            Use this URL
          </button>
        </div>
      )}
    </fieldset>
  );
}
