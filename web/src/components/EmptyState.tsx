import type { ComponentChildren } from 'preact';

export function EmptyState({ title, children }: { title: string; children?: ComponentChildren }) {
  return (
    <div class="empty">
      <h2>{title}</h2>
      {children && <div class="muted">{children}</div>}
    </div>
  );
}
