import { useEffect } from 'preact/hooks';

export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · link-shortener` : 'link-shortener';
  }, [title]);
}
