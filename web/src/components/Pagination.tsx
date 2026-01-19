interface Props {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pages, onPage }: Props) {
  if (pages <= 1) return null;
  return (
    <nav class="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span class="muted">
        Page {page} of {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
