import React, { useState } from 'react';
import { PALETTE_ITEMS, PaletteItem, ComponentType } from '@/types/circuit';
import { CircuitSymbolSVG } from './CircuitSymbolSVG';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  onDragStart: (type: ComponentType) => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'source', label: 'Nguồn điện' },
  { key: 'passive', label: 'Linh kiện thụ động' },
  { key: 'switch', label: 'Công tắc / Khóa' },
  { key: 'meter', label: 'Dụng cụ đo' },
  { key: 'other', label: 'Khác' },
];

export const ComponentPalette: React.FC<Props> = ({ onDragStart }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: 'hsl(var(--palette-bg))' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--palette-hover))' }}>
        <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--palette-foreground))' }}>
          Ký hiệu điện
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map(cat => {
          const items = PALETTE_ITEMS.filter(p => p.category === cat.key);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat.key];
          
          return (
            <div key={cat.key}>
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors"
                style={{ color: 'hsl(var(--status-foreground))' }}
              >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {cat.label}
              </button>
              
              {!isCollapsed && items.map(item => (
                <div
                  key={item.type}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('componentType', item.type);
                    onDragStart(item.type);
                  }}
                >
                  <div className="flex-shrink-0" style={{ color: 'hsl(var(--palette-foreground))' }}>
                    <CircuitSymbolSVG type={item.type} size={44} strokeColor="currentColor" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate" style={{ color: 'hsl(var(--palette-foreground))' }}>
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--status-foreground))' }}>
                      {item.shortLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
