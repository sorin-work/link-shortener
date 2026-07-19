export function Tags({ tags, onSelect }: { tags: string[]; onSelect?: (tag: string) => void }) {
  if (tags.length === 0) return null;
  return (
    <span class="tags">
      {tags.map((tag) =>
        onSelect ? (
          <button
            key={tag}
            type="button"
            class="tag"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(tag);
            }}
          >
            #{tag}
          </button>
        ) : (
          <span key={tag} class="tag">
            #{tag}
          </span>
        ),
      )}
    </span>
  );
}
