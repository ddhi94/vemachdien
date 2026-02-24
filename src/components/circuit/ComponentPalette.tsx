import React, { useState, useMemo } from 'react';
import { PALETTE_ITEMS, ComponentType } from '@/types/circuit';
import { CircuitSymbolSVG } from './CircuitSymbolSVG';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

interface Props {
  onDragStart: (type: ComponentType, label?: string) => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'source', label: 'Nguồn điện' },
  { key: 'passive', label: 'Linh kiện thụ động' },
  { key: 'switch', label: 'Công tắc / Khóa' },
  { key: 'meter', label: 'Dụng cụ đo' },
  { key: 'other', label: 'Khác' },
  { key: 'point', label: 'Điểm nối' },
  { key: 'mechanic', label: 'Cơ học' },
];

export const ComponentPalette: React.FC<Props> = ({ onDragStart }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const toggleCategory = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return PALETTE_ITEMS;
    const q = search.toLowerCase();
    return PALETTE_ITEMS.filter(
      p => p.label.toLowerCase().includes(q) ||
        p.shortLabel.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="w-52 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: 'hsl(var(--palette-bg))' }}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: 'hsl(var(--palette-hover))' }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'hsl(var(--primary))' }}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'hsl(var(--palette-foreground))' }}>
          Linh kiện
        </span>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--status-foreground))' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm linh kiện..."
            className="w-full text-xs py-1.5 pl-7 pr-2 rounded-md outline-none border-0"
            style={{
              background: 'hsl(var(--palette-hover))',
              color: 'hsl(var(--palette-foreground))',
              caretColor: 'hsl(var(--primary))',
            }}
          />
        </div>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto py-0.5 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--palette-hover)) transparent' }}>
        {CATEGORIES.map(cat => {
          const items = filteredItems.filter(p => p.category === cat.key);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat.key] && !search.trim();

          return (
            <div key={cat.key}>
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest hover:opacity-80 transition-opacity"
                style={{ color: 'hsl(var(--status-foreground))' }}
              >
                <span className="transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>
                  <ChevronDown size={11} />
                </span>
                {cat.label}
                <span className="ml-auto text-[9px] font-mono opacity-50">{items.length}</span>
              </button>

              <div
                className="category-items"
                style={{
                  maxHeight: isCollapsed ? '0' : `${items.length * 44 + 8}px`,
                  opacity: isCollapsed ? 0 : 1,
                }}
              >
                {items.map((item, idx) => (
                  <div
                    key={`${item.type}_${item.shortLabel}_${idx}`}
                    className="palette-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('componentType', item.type);
                      e.dataTransfer.setData('componentLabel', item.label);
                      onDragStart(item.type, item.label);
                    }}
                  >
                    <div className="flex-shrink-0 w-10 flex items-center justify-center" style={{ color: 'hsl(var(--palette-foreground))' }}>
                      {item.type === 'junction' ? (
                        <svg width={36} height={24} viewBox="-18 -12 36 24">
                          <circle cx={0} cy={0} r={3.5} fill="currentColor" />
                          <text x={0} y={-5} fontSize={10} fontWeight="600" fill="currentColor" textAnchor="middle">{item.shortLabel}</text>
                        </svg>
                      ) : (item.type === 'terminal_positive' || item.type === 'terminal_negative') ? (
                        <svg width={36} height={24} viewBox="-18 -12 36 24">
                          <circle cx={0} cy={-3} r={3.5} fill="currentColor" />
                          <text x={0} y={10} fontSize={10} fontWeight="600" fill="currentColor" textAnchor="middle">{item.shortLabel}</text>
                        </svg>
                      ) : (
                        <CircuitSymbolSVG type={item.type} size={36} strokeColor="currentColor" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[11px] font-medium truncate" style={{ color: 'hsl(var(--palette-foreground))' }}>
                        {item.label}
                      </span>
                      <span className="text-[9px] font-mono opacity-50" style={{ color: 'hsl(var(--palette-foreground))' }}>
                        {item.shortLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
