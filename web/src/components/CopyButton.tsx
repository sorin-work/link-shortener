import { useEffect, useState } from 'preact/hooks';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy(e: Event) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt('Copy this link', text);
    }
  }

  return (
    <button type="button" class="small" onClick={copy} title={`Copy ${text}`}>
      {copied ? 'Copied' : label}
    </button>
  );
}
