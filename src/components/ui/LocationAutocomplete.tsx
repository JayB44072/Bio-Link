import React, { useState, useRef, useEffect } from 'react';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';

export interface LocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
  isDark?: boolean;
  label?: string;
  myLocationLabel?: string;
}

/**
 * Champ d'adresse avec autocomplétion via Nominatim (OpenStreetMap) — gratuit,
 * sans clé API. Propose aussi un bouton "Ma position" basé sur la géolocalisation
 * du navigateur, résolue en adresse lisible par reverse-geocoding Nominatim.
 */
export default function LocationAutocomplete({
  value, onChange, placeholder, isDark: dk = false, label, myLocationLabel,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value.address || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value.address || ''), [value.address]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    onChange({ address: v, lat: null, lng: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(v)}`
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  function selectSuggestion(s: NominatimResult) {
    setQuery(s.display_name);
    onChange({ address: s.display_name, lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]);
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();
        const address = data.display_name || `${latitude}, ${longitude}`;
        setQuery(address);
        onChange({ address, lat: latitude, lng: longitude });
      } catch {
        onChange({ address: `${latitude}, ${longitude}`, lat: latitude, lng: longitude });
      } finally {
        setLocating(false);
      }
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  }

  const inputBg     = dk ? '#0d0d22' : '#faf9ff';
  const inputBorder = dk ? 'rgba(139,124,255,0.18)' : '#e6e1fb';
  const txtPrim     = dk ? '#f2f1ff' : '#16162e';
  const txtSub      = dk ? '#8c8ab0' : '#8a87a3';
  const surface     = dk ? '#12122b' : '#ffffff';

  return (
    <div ref={boxRef} className="relative">
      {label && <label className="block text-sm font-semibold mb-1.5" style={{ color: dk ? '#c7c5e8' : '#2d2b45' }}>{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: txtSub }} />
          <input
            type="text" value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl pl-9 pr-8 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: txtSub }} />}
        </div>
        <button type="button" onClick={useMyLocation} disabled={locating}
          title={myLocationLabel}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
          {locating ? <Loader2 size={16} className="text-white animate-spin" /> : <LocateFixed size={16} className="text-white" />}
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-xl border py-1 z-50 max-h-56 overflow-y-auto"
          style={{ background: surface, borderColor: inputBorder }}>
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => selectSuggestion(s)}
              className="w-full text-left px-3.5 py-2.5 text-xs flex items-start gap-2 transition-colors hover:opacity-80"
              style={{ color: txtPrim }}>
              <MapPin size={12} className="shrink-0 mt-0.5" style={{ color: txtSub }} />
              <span className="leading-snug">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
