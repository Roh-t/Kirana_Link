export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-box">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search products... e.g. atta, sharbati, चीनी, chawal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button className="clear-btn" onClick={() => onChange("")} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
