import { useEffect, useRef, useState } from "react";
import { fetchSuggestions } from "../api";

/**
 * Search-as-you-type bar.
 * - Debounced (250ms) so we don't spam the API on every keystroke.
 * - Cancels the previous in-flight request via AbortController, so a slow
 *   earlier response can never overwrite a newer one.
 * - Shows a live dropdown of the top matches (name, image, price) while
 *   the full grid below updates with the complete ranked result set.
 */
export default function SearchBar({ value, onChange, onSelectProduct }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const data = await fetchSuggestions(value, controller.signal);
        setSuggestions(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch (e) {
        // ignore aborted requests
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pick(item) {
    onChange(item.Name);
    setOpen(false);
    if (onSelectProduct) onSelectProduct(item);
  }

  return (
    <div className="search-box" ref={boxRef}>
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search products... e.g. atta, sharbati, चीनी, chawal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button className="clear-btn" onClick={() => onChange("")} aria-label="Clear">
            ✕
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <div
              key={s._id}
              className={"suggestion-item" + (i === activeIndex ? " active" : "")}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <img src={s.Image} alt="" className="suggestion-img" loading="lazy" />
              <div className="suggestion-text">
                <div className="suggestion-name">{s.Name}</div>
                <div className="suggestion-meta">
                  {s["Exact Category"]} {s.Quantity ? `· ${s.Quantity}` : ""}
                </div>
              </div>
              {s.Price != null && <div className="suggestion-price">₹{s.Price}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
