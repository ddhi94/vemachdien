import React from 'react';
import { ComponentType } from '@/types/circuit';

interface Props {
  type: ComponentType;
  size?: number;
  strokeColor?: string;
  className?: string;
  value?: string;
}

// Each symbol is drawn centered at (0,0) within a size x size/2 box
// Connection points at left (-size/2, 0) and right (size/2, 0)
export const CircuitSymbolSVG: React.FC<Props> = ({
  type,
  size = 60,
  strokeColor = 'currentColor',
  className,
  value
}) => {
  const hw = size / 2; // half width
  const hh = size / 4; // half height
  const sw = 2; // stroke width

  return (
    <svg width={size} height={size / 1.5} viewBox={`${-hw} ${-hh * 1.5} ${size} ${hh * 3}`} className={className}>
      {renderSymbolOnCanvas(type, strokeColor, sw, size, value)}
    </svg>
  );
};

// For rendering on the canvas with transform
export const renderSymbolOnCanvas = (
  type: ComponentType,
  strokeColor: string = 'hsl(215, 30%, 20%)',
  sw: number = 2,
  size: number = 60,
  value?: string
): React.ReactNode => {
  const hw = size / 2;
  const hh = size / 4;

  switch (type) {
    case 'resistor':
      // Điện trở: hcn 30x10, không có đường xuyên qua ở giữa hcn
      return (
        <g>
          <line x1={-hw} y1={0} x2={-15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-15} y={-5} width={30} height={10} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'variable_resistor':
      // Biến trở con chạy (Rheostat): hcn 30x10, mũi tên con chạy từ trên xuống
      return (
        <g>
          <line x1={-hw} y1={0} x2={-15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-15} y={-5} width={30} height={10} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          {/* Con chạy (C) */}
          <line x1={0} y1={-15} x2={0} y2={-5} stroke={strokeColor} strokeWidth={sw} />
          <polygon points="0,-5 -3,-10 3,-10" fill={strokeColor} />
          <text x={-12} y={12} fontSize={8} fill={strokeColor}>M</text>
          <text x={8} y={12} fontSize={8} fill={strokeColor}>N</text>
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

    case 'battery_single':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-4} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-4} y1={-12} x2={-4} y2={12} stroke={strokeColor} strokeWidth={sw} />
          <line x1={4} y1={-7} x2={4} y2={7} stroke={strokeColor} strokeWidth={sw + 2} />
          <line x1={4} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <text x={-6} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="end">+</text>
          <text x={6} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="start">−</text>
        </g>
      );

    case 'battery':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-12} y1={-12} x2={-12} y2={12} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-4} y1={-7} x2={-4} y2={7} stroke={strokeColor} strokeWidth={sw + 2} />
          <line x1={-4} y1={0} x2={4} y2={0} stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" />
          <line x1={4} y1={-12} x2={4} y2={12} stroke={strokeColor} strokeWidth={sw} />
          <line x1={12} y1={-7} x2={12} y2={7} stroke={strokeColor} strokeWidth={sw + 2} />
          <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <text x={-14} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="end">+</text>
          <text x={14} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="start">−</text>
        </g>
      );

    case 'junction':
      return (
        <g>
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
        </g>
      );

    case 'terminal_positive':
      return (
        <g>
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <text x={0} y={14} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
        </g>
      );

    case 'terminal_negative':
      return (
        <g>
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <text x={0} y={14} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
        </g>
      );

    case 'switch_open':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={-12} cy={0} r={2.5} fill={strokeColor} />
          <line x1={-12} y1={0} x2={12} y2={-12} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={15} cy={0} r={2.5} fill={strokeColor} />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={-15} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">K</text>
        </g>
      );

    case 'switch_closed':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={-12} cy={0} r={2.5} fill={strokeColor} />
          <line x1={-12} y1={0} x2={15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={15} cy={0} r={2.5} fill={strokeColor} />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={-10} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">K</text>
        </g>
      );

    case 'bulb':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-12} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={12} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <line x1={-8.48} y1={-8.48} x2={8.48} y2={8.48} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8.48} y1={-8.48} x2={-8.48} y2={8.48} stroke={strokeColor} strokeWidth={sw} />
          <line x1={12} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'ammeter':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">A</text>
          <text x={-20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
          <text x={20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'voltmeter':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">V</text>
          <text x={-20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
          <text x={20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
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
          <polygon points="-8,-10 -8,10 8,0" fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'led':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-8} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <polygon points="-8,-10 -8,10 8,0" fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={-10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={8} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <line x1={2} y1={-14} x2={8} y2={-20} stroke={strokeColor} strokeWidth={1.5} />
          <polygon points="8,-20 4,-18 6,-16" fill={strokeColor} />
          <line x1={7} y1={-12} x2={13} y2={-18} stroke={strokeColor} strokeWidth={1.5} />
          <polygon points="13,-18 9,-16 11,-14" fill={strokeColor} />
        </g>
      );

    case 'motor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">M</text>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'generator':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">G</text>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'photoresistor':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <rect x={-15} y={-5} width={30} height={10} fill="none" stroke={strokeColor} strokeWidth={sw} />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={18} fill="none" stroke={strokeColor} strokeWidth={1} strokeDasharray="2 2" />
          <path d="M -10 -25 L -4 -15 M -4 -25 L 2 -15" stroke={strokeColor} strokeWidth={1.5} />
        </g>
      );

    case 'transformer':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <path d="M -15 0 A 5 5 0 0 1 -5 0 A 5 5 0 0 1 5 0 A 5 5 0 0 1 15 0" fill="none" stroke={strokeColor} strokeWidth={sw} transform="translate(0, -8)" />
          <line x1={-10} y1={-2} x2={10} y2={-2} stroke={strokeColor} strokeWidth={2} />
          <line x1={-10} y1={2} x2={10} y2={2} stroke={strokeColor} strokeWidth={2} />
          <path d="M -15 0 A 5 5 0 0 0 -5 0 A 5 5 0 0 0 5 0 A 5 5 0 0 0 15 0" fill="none" stroke={strokeColor} strokeWidth={sw} transform="translate(0, 8)" />
          <line x1={15} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'ground':
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-8} y1={10} x2={8} y2={10} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-5} y1={14} x2={5} y2={14} stroke={strokeColor} strokeWidth={sw} />
          <line x1={-2} y1={18} x2={2} y2={18} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'mech_support':
      return (
        <g>
          <line x1={-20} y1={0} x2={20} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
          {[-15, -5, 5, 15].map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x + 5} y2={-8} stroke={strokeColor} strokeWidth={1} />
          ))}
          <circle cx={0} cy={0} r={2} fill={strokeColor} />
        </g>
      );

    case 'mech_spring':
      return (
        <g>
          <path d="M -20 0 L -18 -4 L -14 4 L -10 -4 L -6 4 L -2 -4 L 2 4 L 6 -4 L 10 4 L 14 -4 L 18 4 L 20 0" fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );

    case 'mech_block':
      return (
        <g>
          <rect x={-15} y={-15} width={30} height={30} fill="#f0f4f8" stroke={strokeColor} strokeWidth={sw} rx={2} />
          <text x={0} y={4} fontSize={14} fontWeight="bold" fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">m</text>
        </g>
      );

    case 'mech_pulley_fixed':
      return (
        <g>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <circle cx={0} cy={0} r={16} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <path d="M -16 0 A 16 16 0 0 1 16 0" fill="none" stroke={strokeColor} strokeWidth={sw} strokeDasharray="4 2" />
          <line x1={-16} y1={0} x2={-16} y2={25} stroke={strokeColor} strokeWidth={1.5} />
          <line x1={16} y1={0} x2={16} y2={25} stroke={strokeColor} strokeWidth={1.5} />
          <path d="M 0 0 L 0 -16 M -8 -16 L 8 -16 M -4 -20 L -8 -16 M 0 -20 L -4 -16 M 4 -20 L 0 -16 M 8 -20 L 4 -16" stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'mech_pulley_movable':
      return (
        <g>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <circle cx={0} cy={0} r={16} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <path d="M -16 0 A 16 16 0 0 0 16 0" fill="none" stroke={strokeColor} strokeWidth={sw} strokeDasharray="4 2" />
          <line x1={-16} y1={0} x2={-16} y2={-25} stroke={strokeColor} strokeWidth={1.5} />
          <line x1={16} y1={0} x2={16} y2={-25} stroke={strokeColor} strokeWidth={1.5} />
          <line x1={0} y1={0} x2={0} y2={16} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'mech_inclined_plane':
      const angle = value ? parseFloat(value) : 30;
      const angleRad = (angle * Math.PI) / 180;
      const baseLen = 60;
      const height = baseLen * Math.tan(angleRad);
      const scale = height > 40 ? 40 / height : 1;
      const drawBase = baseLen * scale;
      const drawHeight = height * scale;

      return (
        <g>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <polygon points={`${-drawBase / 2},${drawHeight / 2} ${drawBase / 2},${drawHeight / 2} ${drawBase / 2},${-drawHeight / 2}`} fill="#f8fafc" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M ${-drawBase / 2 + 15} ${drawHeight / 2} A 15 15 0 0 0 ${-drawBase / 2 + 15 * Math.cos(angleRad)} ${drawHeight / 2 - 15 * Math.sin(angleRad)}`} fill="none" stroke={strokeColor} strokeWidth={1} />
          <text x={-drawBase / 2 + 20} y={drawHeight / 2 - 5} fontSize={10} fill={strokeColor} fontStyle="italic">{angle}°</text>
        </g>
      );

    case 'mech_pendulum':
      return (
        <g>
          <line x1={-15} y1={0} x2={15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          {[-12, -6, 0, 6, 12].map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x + 3} y2={-5} stroke={strokeColor} strokeWidth={1} />
          ))}
          <line x1={0} y1={0} x2={0} y2={40} stroke={strokeColor} strokeWidth={1} />
          <circle cx={0} cy={40} r={8} fill="#94a3b8" stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'mech_cart':
      return (
        <g>
          <rect x={-20} y={-12} width={40} height={15} fill="#f1f5f9" stroke={strokeColor} strokeWidth={sw} rx={2} />
          <circle cx={-12} cy={7} r={4} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={12} cy={7} r={4} fill="white" stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'mech_vector':
      return (
        <g>
          <line x1={0} y1={0} x2={40} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
          <polygon points="40,0 32,-4 32,4" fill={strokeColor} />
        </g>
      );

    case 'mech_axis':
      const axisLen = value ? parseFloat(value) : 100;
      return (
        <g>
          <line x1={0} y1={0} x2={axisLen} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`${axisLen},0 ${axisLen - 8},-4 ${axisLen - 8},4`} fill={strokeColor} />
        </g>
      );

    case 'mech_line_dashed':
      const dashLen = value ? parseFloat(value) : 60;
      return (
        <g>
          <line x1={0} y1={0} x2={dashLen} y2={0} stroke={strokeColor} strokeWidth={1.5} strokeDasharray="4 3" />
        </g>
      );

    case 'mech_arc':
      const arcWidth = 20;
      const arcAngle = value ? parseFloat(value) : 45;
      const arcAngleRad = (arcAngle * Math.PI) / 180;
      const arcX = arcWidth * Math.cos(arcAngleRad);
      const arcY = -arcWidth * Math.sin(arcAngleRad);
      return (
        <g>
          <path d={`M ${arcWidth} 0 A ${arcWidth} ${arcWidth} 0 0 0 ${arcX} ${arcY}`} fill="none" stroke={strokeColor} strokeWidth={1} />
        </g>
      );

    case 'mech_trajectory':
      // Basic parabola curve: y = a*x^2
      // Using value for horizontal extent
      const trajWidth = value ? parseFloat(value) : 120;
      const trajHeight = 60;
      return (
        <g>
          <path d={`M 0 0 Q ${trajWidth / 2} ${-trajHeight * 1.5} ${trajWidth} 0`} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeDasharray="4 2" />
        </g>
      );

    default:
      return <rect x={-hw} y={-hh} width={size} height={hh * 2} fill="none" stroke={strokeColor} strokeWidth={sw} />;
  }
};
