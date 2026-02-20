import React from 'react';
import { ComponentType } from '@/types/circuit';

interface Props {
  type: ComponentType;
  size?: number;
  strokeColor?: string;
  className?: string;
}

// Each symbol is drawn centered at (0,0) within a size x size/2 box
// Connection points at left (-size/2, 0) and right (size/2, 0)
export const CircuitSymbolSVG: React.FC<Props> = ({ 
  type, 
  size = 60,
  strokeColor = 'currentColor',
  className 
}) => {
  const hw = size / 2; // half width
  const hh = size / 4; // half height
  const sw = 2; // stroke width

  const renderSymbol = () => {
    switch (type) {
      case 'resistor':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <rect x={-hw + 12} y={-hh / 1.5} width={size - 24} height={hh * 1.33} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'variable_resistor':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <rect x={-hw + 12} y={-hh / 1.5} width={size - 24} height={hh * 1.33} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {/* Arrow through */}
            <line x1={-hw + 16} y1={hh} x2={hw - 10} y2={-hh * 0.8} stroke={strokeColor} strokeWidth={sw} />
            <polygon points={`${hw - 10},${-hh * 0.8} ${hw - 16},${-hh * 0.3} ${hw - 14},${-hh * 0.9}`} fill={strokeColor} />
          </g>
        );

      case 'capacitor':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-4} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <line x1={-4} y1={-hh} x2={-4} y2={hh} stroke={strokeColor} strokeWidth={sw + 0.5} />
            <line x1={4} y1={-hh} x2={4} y2={hh} stroke={strokeColor} strokeWidth={sw + 0.5} />
            <line x1={4} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'inductor':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-hw + 10} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {[0, 1, 2, 3].map(i => {
              const cx = -hw + 15 + i * 8;
              return <path key={i} d={`M ${cx - 4} 0 A 4 4 0 0 1 ${cx + 4} 0`} fill="none" stroke={strokeColor} strokeWidth={sw} />;
            })}
            <line x1={hw - 10} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'battery':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {/* Short thick line (negative) */}
            <line x1={-8} y1={-hh * 0.5} x2={-8} y2={hh * 0.5} stroke={strokeColor} strokeWidth={sw + 1} />
            {/* Long thin line (positive) */}
            <line x1={-2} y1={-hh} x2={-2} y2={hh} stroke={strokeColor} strokeWidth={sw} />
            {/* Second cell */}
            <line x1={4} y1={-hh * 0.5} x2={4} y2={hh * 0.5} stroke={strokeColor} strokeWidth={sw + 1} />
            <line x1={10} y1={-hh} x2={10} y2={hh} stroke={strokeColor} strokeWidth={sw} />
            <line x1={10} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {/* + and - labels */}
            <text x={12} y={-hh - 2} fontSize={8} fill={strokeColor} textAnchor="start">+</text>
            <text x={-14} y={-hh - 2} fontSize={8} fill={strokeColor} textAnchor="end">−</text>
          </g>
        );

      case 'switch_open':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={-10} cy={0} r={3} fill={strokeColor} />
            <line x1={-10} y1={0} x2={12} y2={-hh * 1.2} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={14} cy={0} r={3} fill={strokeColor} />
            <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'switch_closed':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={-10} cy={0} r={3} fill={strokeColor} />
            <line x1={-10} y1={0} x2={14} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={14} cy={0} r={3} fill={strokeColor} />
            <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'bulb':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={0} r={12} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={-8} y1={-8} x2={8} y2={8} stroke={strokeColor} strokeWidth={sw} />
            <line x1={8} y1={-8} x2={-8} y2={8} stroke={strokeColor} strokeWidth={sw} />
            <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'ammeter':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={0} r={14} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">A</text>
            <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'voltmeter':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={0} r={14} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">V</text>
            <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'fuse':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <rect x={-hw + 12} y={-hh / 2} width={size - 24} height={hh} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={-hw + 14} y1={0} x2={hw - 14} y2={0} stroke={strokeColor} strokeWidth={1} />
            <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'bell':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={-2} r={10} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <path d={`M -3 8 Q 0 12 3 8`} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'diode':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <polygon points={`-8,-10 -8,10 8,0`} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
            <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'led':
        return (
          <g>
            <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <polygon points={`-8,-10 -8,10 8,0`} fill="none" stroke={strokeColor} strokeWidth={sw} />
            <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
            <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {/* Light arrows */}
            <line x1={2} y1={-14} x2={8} y2={-20} stroke={strokeColor} strokeWidth={1.5} />
            <polygon points={`8,-20 4,-18 6,-16`} fill={strokeColor} />
            <line x1={7} y1={-12} x2={13} y2={-18} stroke={strokeColor} strokeWidth={1.5} />
            <polygon points={`13,-18 9,-16 11,-14`} fill={strokeColor} />
          </g>
        );

      default:
        return <rect x={-hw} y={-hh} width={size} height={hh * 2} fill="none" stroke={strokeColor} strokeWidth={sw} />;
    }
  };

  return (
    <svg width={size} height={size / 1.5} viewBox={`${-hw} ${-hh * 1.5} ${size} ${hh * 3}`} className={className}>
      {renderSymbol()}
    </svg>
  );
};

// For rendering on the canvas with transform
export const renderSymbolOnCanvas = (
  type: ComponentType,
  strokeColor: string = 'hsl(215, 30%, 20%)',
  sw: number = 2,
  size: number = 60,
): React.ReactNode => {
  const hw = size / 2;
  const hh = size / 4;

  switch (type) {
    case 'resistor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-hw + 12} y={-hh / 1.5} width={size - 24} height={hh * 1.33} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'variable_resistor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-hw + 12} y={-hh / 1.5} width={size - 24} height={hh * 1.33} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-hw + 16} y1={hh} x2={hw - 10} y2={-hh * 0.8} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`${hw - 10},${-hh * 0.8} ${hw - 16},${-hh * 0.3} ${hw - 14},${-hh * 0.9}`} fill={strokeColor} />
        </g>
      );

    case 'capacitor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-4} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-4} y1={-hh} x2={-4} y2={hh} stroke={strokeColor} strokeWidth={sw + 0.5} />
          <line x1={4} y1={-hh} x2={4} y2={hh} stroke={strokeColor} strokeWidth={sw + 0.5} />
          <line x1={4} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'inductor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-hw + 10} y2={0} stroke={strokeColor} strokeWidth={sw} />
          {[0, 1, 2, 3].map(i => {
            const cx = -hw + 15 + i * 8;
            return <path key={i} d={`M ${cx - 4} 0 A 4 4 0 0 1 ${cx + 4} 0`} fill="none" stroke={strokeColor} strokeWidth={sw} />;
          })}
          <line x1={hw - 10} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'battery':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-8} y1={-hh * 0.5} x2={-8} y2={hh * 0.5} stroke={strokeColor} strokeWidth={sw + 1} />
          <line x1={-2} y1={-hh} x2={-2} y2={hh} stroke={strokeColor} strokeWidth={sw} />
          <line x1={4} y1={-hh * 0.5} x2={4} y2={hh * 0.5} stroke={strokeColor} strokeWidth={sw + 1} />
          <line x1={10} y1={-hh} x2={10} y2={hh} stroke={strokeColor} strokeWidth={sw} />
          <line x1={10} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <text x={12} y={-hh - 2} fontSize={8} fill={strokeColor} textAnchor="start">+</text>
          <text x={-14} y={-hh - 2} fontSize={8} fill={strokeColor} textAnchor="end">−</text>
        </g>
      );

    case 'switch_open':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={-10} cy={0} r={3} fill={strokeColor} />
          <line x1={-10} y1={0} x2={12} y2={-hh * 1.2} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={14} cy={0} r={3} fill={strokeColor} />
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'switch_closed':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={-10} cy={0} r={3} fill={strokeColor} />
          <line x1={-10} y1={0} x2={14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={14} cy={0} r={3} fill={strokeColor} />
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'bulb':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={12} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <line x1={-8} y1={-8} x2={8} y2={8} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={-8} x2={-8} y2={8} stroke={strokeColor} strokeWidth={sw} />
          <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'ammeter':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">A</text>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'voltmeter':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">V</text>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'fuse':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-hw + 12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-hw + 12} y={-hh / 2} width={size - 24} height={hh} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <line x1={-hw + 14} y1={0} x2={hw - 14} y2={0} stroke={strokeColor} strokeWidth={1} />
          <line x1={hw - 12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'bell':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={-2} r={10} fill="hsl(0, 0%, 100%)" stroke={strokeColor} strokeWidth={sw} />
          <path d={`M -3 8 Q 0 12 3 8`} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'diode':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`-8,-10 -8,10 8,0`} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'led':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`-8,-10 -8,10 8,0`} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={2} y1={-14} x2={8} y2={-20} stroke={strokeColor} strokeWidth={1.5} />
          <polygon points={`8,-20 4,-18 6,-16`} fill={strokeColor} />
          <line x1={7} y1={-12} x2={13} y2={-18} stroke={strokeColor} strokeWidth={1.5} />
          <polygon points={`13,-18 9,-16 11,-14`} fill={strokeColor} />
        </g>
      );

    default:
      return <rect x={-hw} y={-hh} width={size} height={hh * 2} fill="none" stroke={strokeColor} strokeWidth={sw} />;
  }
};
