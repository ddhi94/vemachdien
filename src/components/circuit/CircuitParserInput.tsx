import React, { useState } from 'react';
import { parseCircuitNotation } from '@/lib/circuitParser';
import { CircuitComponent, Wire } from '@/types/circuit';
import { Zap, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  onParse: (components: CircuitComponent[], wires: Wire[]) => void;
}

export const CircuitParserInput: React.FC<Props> = ({ onParse }) => {
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleParse = () => {
    if (!input.trim()) return;
    const result = parseCircuitNotation(input);
    onParse(result.components, result.wires);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
  };

  const examples = [
    'R1ntR2',
    'R1//R2',
    'R//R1nt(R2//R3)',
    'UntKdntR1nt(R2//R3)',
    'Unt(R1//R2)ntĐ',
    'gd nt lx nt m',
    'rr nt m',
  ];

  return (
    <div
      className="border-t"
      style={{ background: 'hsl(var(--toolbar-bg))', borderColor: 'hsl(var(--toolbar-border))' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-accent" />
          <span>Nhập công thức mạch điện</span>
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="VD: R//R1nt(R2//R3)"
              className="flex-1 px-3 py-2 text-sm font-mono rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleParse}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Vẽ
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => { setInput(ex); }}
                className="px-2 py-1 text-[11px] font-mono rounded border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <p><span className="font-mono font-medium">nt</span> = nối tiếp &nbsp; <span className="font-mono font-medium">//</span> = song song &nbsp; <span className="font-mono font-medium">()</span> = nhóm</p>
            <p><span className="font-mono">R</span>=Điện trở <span className="font-mono">U</span>=Nguồn <span className="font-mono">Kd/Km</span>=Khóa <span className="font-mono">lx</span>=lò xo <span className="font-mono">m</span>=vật <span className="font-mono">rr</span>=ròng rọc</p>
          </div>
        </div>
      )}
    </div>
  );
};
