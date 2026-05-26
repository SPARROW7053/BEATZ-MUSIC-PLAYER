import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import countryCodes from '../data/countryCodes';

const CountryPicker = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = countryCodes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
          open ? 'bg-white/10 border-neon-cyan/40' : 'bg-white/[0.03] border-white/10 hover:bg-white/5'
        }`}
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-white/80">{selected.dial}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 max-h-64 rounded-2xl overflow-hidden z-50 shadow-2xl"
          style={{
            background: 'rgba(10,10,16,0.97)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country..."
                className="bg-transparent text-sm text-white placeholder:text-gray-600 outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white shrink-0">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto hide-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-600 text-xs py-6">No countries found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${
                    selected.code === c.code ? 'bg-neon-cyan/10 text-white' : 'text-gray-400'
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryPicker;
