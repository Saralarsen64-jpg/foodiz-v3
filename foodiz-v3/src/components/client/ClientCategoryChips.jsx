export function ClientCategoryChips({ categories = [], activeCategory, onSelect }) {
  return (
    <div className="client-category-chips" role="tablist" aria-label="Catégories Foodiz">
      {categories.map((category) => {
        const active = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            className={`client-category-chips__item ${active ? 'is-active' : ''}`}
            onClick={() => onSelect?.(category)}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
