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

// Helper functions for dynamic pulley kinematics
export const getPulleyKinematics = (params: string[], isMovable: boolean) => {
  const R = 22;
  const p0 = parseFloat(params[0]); const lenL = isNaN(p0) ? 25 : p0;
  const p1 = parseFloat(params[1]); const lenR = isNaN(p1) ? lenL : p1;

  if (isMovable) {
    const p2 = parseFloat(params[2]); const lenB = isNaN(p2) ? 22 : p2;
    const p3 = parseFloat(params[3]); const angL = isNaN(p3) ? 0 : p3;
    const p4 = parseFloat(params[4]); const angR = isNaN(p4) ? 0 : p4;
    const p5 = parseFloat(params[5]); const angB = isNaN(p5) ? 0 : p5;
    const radL = (angL * Math.PI) / 180;
    const radR = (angR * Math.PI) / 180;
    const radB = (angB * Math.PI) / 180;

    const tL = { x: -R * Math.cos(radL), y: R * Math.sin(radL) };
    const pL = { x: tL.x - lenL * Math.sin(radL), y: tL.y - lenL * Math.cos(radL) };

    const tR = { x: R * Math.cos(radR), y: R * Math.sin(radR) };
    const pR = { x: tR.x + lenR * Math.sin(radR), y: tR.y - lenR * Math.cos(radR) };

    const pB = { x: lenB * Math.sin(radB), y: lenB * Math.cos(radB) };

    return { pL, pR, pM: pB, tL, tR };
  } else {
    // Fixed Pulley
    const p2 = parseFloat(params[2]); const angL = isNaN(p2) ? 0 : p2;
    const p3 = parseFloat(params[3]); const angR = isNaN(p3) ? 0 : p3;
    const p4 = parseFloat(params[4]); const lenT = isNaN(p4) ? 35 : p4;
    const p5 = parseFloat(params[5]); const angT = isNaN(p5) ? 0 : p5;
    const radL = (angL * Math.PI) / 180;
    const radR = (angR * Math.PI) / 180;
    const radT = (angT * Math.PI) / 180;

    const tL = { x: -R * Math.cos(radL), y: -R * Math.sin(radL) };
    const pL = { x: tL.x - lenL * Math.sin(radL), y: tL.y + lenL * Math.cos(radL) };

    const tR = { x: R * Math.cos(radR), y: -R * Math.sin(radR) };
    const pR = { x: tR.x + lenR * Math.sin(radR), y: tR.y + lenR * Math.cos(radR) };

    const pT = { x: lenT * Math.sin(radT), y: -lenT * Math.cos(radT) };

    return { pL, pR, pM: pT, tL, tR };
  }
};

// For rendering on the canvas with transform
export const renderSymbolOnCanvas = (
  type: ComponentType,
  strokeColor: string = 'hsl(215, 30%, 20%)',
  originalSw: number = 2,
  size: number = 60,
  value?: string
): React.ReactNode => {
  const hw = size / 2;
  const hh = size / 4;

  // Multi-parameter support: e.g. "value1, value2, ..."
  const params = value ? value.split(',').map(s => s.trim()) : [];
  const val1 = params[0]; // Main value (label, length, etc.)
  const val2 = params[1]; // Secondary value (scale, or vector length, trajectory height)
  const val3 = params[2]; // Tertiary value (flags)
  const val4 = params[3];
  const val5 = params[4];
  const val6 = params[5];

  const scaleVal = parseFloat(val2);
  const scale = (type === 'mech_vector' || type === 'mech_trajectory' || type === 'mech_pulley_fixed') ? 1 : (val2 && !isNaN(scaleVal) ? scaleVal : 1);
  const sw = originalSw / scale;

  const symbolContent = (() => {
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
        const supportWidth = 80;
        return (
          <g>
            {/* Main supporting line */}
            <line x1={-supportWidth / 2} y1={0} x2={supportWidth / 2} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
            {/* Engineering hatching (gạch chéo) */}
            {Array.from({ length: 15 }).map((_, i) => {
              const x = -supportWidth / 2 + 5 + i * 5;
              return <line key={i} x1={x} y1={0} x2={x + 5} y2={-8} stroke={strokeColor} strokeWidth={1} />;
            })}
          </g>
        );

      case 'mech_spring':
        const springLen = val1 ? parseFloat(val1) : 60;
        const numCoils = Math.max(3, Math.floor(springLen / 6));
        const coilRegionBase = 20; // total lead space
        const coilRegionWidth = springLen - coilRegionBase;
        const coilStep = coilRegionWidth / numCoils;
        let d = `M -10 0 L 0 0`; // Start lead
        for (let i = 0; i < numCoils; i++) {
          d += ` q ${coilStep / 4} -8 ${coilStep / 2} 0 q ${coilStep / 4} 8 ${coilStep / 2} 0`;
        }
        d += ` L ${springLen} 0`; // End lead
        return (
          <g transform={`translate(-${springLen / 2}, 0)`}>
            <path d={d} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
          </g>
        );

      case 'mech_block':
      case 'mech_weight_circle':
        const isCircle = type === 'mech_weight_circle';
        const boxSize = 45;
        return (
          <g>
            {isCircle ? (
              <circle cx={0} cy={0} r={boxSize / 2} fill="white" stroke={strokeColor} strokeWidth={sw} />
            ) : (
              <rect x={-boxSize / 2} y={-boxSize / 2} width={boxSize} height={boxSize} fill="white" stroke={strokeColor} strokeWidth={sw} />
            )}
            <text x={0} y={5} fontSize={16} fontWeight="bold" fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">
              m{val1 && <tspan dy={4} fontSize={12}>{val1}</tspan>}
            </text>
          </g>
        );

      case 'mech_pulley_fixed': {
        const pR = 22;
        const { pL, pR: ptR, pM: pT, tL, tR } = getPulleyKinematics(params, false);
        const largeArc = (tL.x * tR.y - tL.y * tR.x < 0) ? 1 : 0;

        return (
          <g>
            <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
            {/* Top Hanger String */}
            <line x1={0} y1={0} x2={pT.x} y2={pT.y} stroke={strokeColor} strokeWidth={sw + 1} />
            <circle cx={0} cy={0} r={pR} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={0} r={4} fill={strokeColor} />

            {/* Wrapped String: Path going from Left Endpoint, to Tangent Left, wrapping over TOP, to Tangent Right, to Right Endpoint */}
            <path d={`M ${pL.x} ${pL.y} L ${tL.x} ${tL.y} A ${pR} ${pR} 0 ${largeArc} 1 ${tR.x} ${tR.y} L ${ptR.x} ${ptR.y}`} fill="none" stroke={strokeColor} strokeWidth={1.5} />
          </g>
        );
      }

      case 'mech_pulley_movable': {
        const mPulleyR = 22;
        const { pL, pR: ptR, pM: pB, tL, tR } = getPulleyKinematics(params, true);
        const largeArc = (tL.x * tR.y - tL.y * tR.x > 0) ? 1 : 0;

        return (
          <g>
            <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
            {/* Bottom Hook String */}
            <line x1={0} y1={0} x2={pB.x} y2={pB.y} stroke={strokeColor} strokeWidth={sw + 1} />
            <circle cx={0} cy={0} r={mPulleyR} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
            <circle cx={0} cy={0} r={4} fill={strokeColor} />

            {/* Wrapped String: Path going from Left Endpoint, to Tangent Left, wrapping UNDER BOTTOM, to Tangent Right, to Right Endpoint */}
            <path d={`M ${pL.x} ${pL.y} L ${tL.x} ${tL.y} A ${mPulleyR} ${mPulleyR} 0 ${largeArc} 0 ${tR.x} ${tR.y} L ${ptR.x} ${ptR.y}`} fill="none" stroke={strokeColor} strokeWidth={1.5} />
          </g>
        );
      }

      case 'mech_inclined_plane':
        const isHidden = val3 === 'hidden';
        const isQuestion = val3 === '?';
        const angle = val1 ? parseFloat(val1) : 30;
        const displayAngle = isQuestion ? '?' : (isHidden ? '' : Math.round(angle) + '°');
        const angleRad = (angle * Math.PI) / 180;
        const baseLen = 80;
        const height = baseLen * Math.tan(angleRad);
        const limitH = 50;
        const planeScale = height > limitH ? limitH / height : 1;
        const drawBase = baseLen * planeScale;
        const drawHeight = height * planeScale;

        const r = 12; // Radius of the angle arc

        return (
          <g>
            <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
            <polygon points={`${-drawBase / 2},${drawHeight / 2} ${drawBase / 2},${drawHeight / 2} ${drawBase / 2},${-drawHeight / 2}`} fill="#f8fafc" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
            <path d={`M ${-drawBase / 2 + r} ${drawHeight / 2} A ${r} ${r} 0 0 0 ${-drawBase / 2 + r * Math.cos(angleRad)} ${drawHeight / 2 - r * Math.sin(angleRad)}`} fill="none" stroke={strokeColor} strokeWidth={1} />
            {!isHidden && (
              <text
                x={-drawBase / 2 + (r + 4) * Math.cos(angleRad / 2) + (isQuestion ? 2 : 0)}
                y={drawHeight / 2 - (r + 4) * Math.sin(angleRad / 2)}
                fontSize={8} fill={strokeColor} stroke="none" fontStyle="italic" textAnchor="start" alignmentBaseline="middle">
                {displayAngle}
              </text>
            )}
          </g>
        );

      case 'mech_pendulum':
        const pendulumLen = val1 ? parseFloat(val1) : 50;
        return (
          <g>
            <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} /> {/* Hit area */}
            <line x1={-15} y1={0} x2={15} y2={0} stroke={strokeColor} strokeWidth={sw} />
            {[-12, -6, 0, 6, 12].map((x, i) => (
              <line key={i} x1={x} y1={0} x2={x + 3} y2={-5} stroke={strokeColor} strokeWidth={1} />
            ))}
            <line x1={0} y1={0} x2={0} y2={pendulumLen} stroke={strokeColor} strokeWidth={1.5} />
            <circle cx={0} cy={pendulumLen} r={10} fill="#94a3b8" stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'mech_cart':
        const cartAngle = val1 ? parseFloat(val1) : 0;
        return (
          <g transform={`rotate(-${cartAngle}, 0, 16)`}>
            <rect x={-30} y={-18} width={60} height={22} fill="#f1f5f9" stroke={strokeColor} strokeWidth={sw} rx={2} />
            <circle cx={-18} cy={10} r={6} fill="white" stroke={strokeColor} strokeWidth={sw} />
            <circle cx={18} cy={10} r={6} fill="white" stroke={strokeColor} strokeWidth={sw} />
          </g>
        );

      case 'mech_vector':
        const vectorLen = val2 ? parseFloat(val2) : 40;
        const vectorLabel = val1 || 'F';
        return (
          <g>
            <line x1={0} y1={0} x2={Math.max(0, vectorLen - 4)} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
            <polygon points={`${vectorLen},0 ${vectorLen - 8},-4 ${vectorLen - 8},4`} fill={strokeColor} />
            <text x={vectorLen / 2} y={-12} fontSize={14} fontFamily="serif" fontStyle="italic" fill={strokeColor} stroke="none" textAnchor="middle">
              {vectorLabel}
              <tspan x={vectorLen / 2} dy={-6} fontSize={12} stroke="none">→</tspan>
            </text>
          </g>
        );

      case 'mech_axis':
        const axisLen = val1 ? parseFloat(val1) : 100;
        return (
          <g>
            <line x1={0} y1={0} x2={axisLen} y2={0} stroke={strokeColor} strokeWidth={sw} />
            <polygon points={`${axisLen},0 ${axisLen - 8},-4 ${axisLen - 8},4`} fill={strokeColor} />
            <text x={axisLen - 5} y={-10} fontSize={12} fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">x</text>
          </g>
        );

      case 'mech_axis_y':
        const yAxisLen = val1 ? parseFloat(val1) : 100;
        return (
          <g>
            <line x1={0} y1={0} x2={0} y2={-yAxisLen} stroke={strokeColor} strokeWidth={sw} />
            <polygon points={`0,${-yAxisLen} -4,${-yAxisLen + 8} 4,${-yAxisLen + 8}`} fill={strokeColor} />
            <text x={12} y={-yAxisLen + 5} fontSize={12} fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">y</text>
          </g>
        );

      case 'mech_line_dashed':
        const dashLen = val1 ? parseFloat(val1) : 60;
        return (
          <g>
            <line x1={0} y1={0} x2={dashLen} y2={0} stroke={strokeColor} strokeWidth={1.5} strokeDasharray="4 3" />
          </g>
        );

      case 'mech_arc':
        const arcWidth = 20;
        const arcAngle = val1 ? parseFloat(val1) : 45;
        const arcAngleRad = (arcAngle * Math.PI) / 180;
        const arcX = arcWidth * Math.cos(arcAngleRad);
        const arcY = -arcWidth * Math.sin(arcAngleRad);
        return (
          <g>
            <path d={`M ${arcWidth} 0 A ${arcWidth} ${arcWidth} 0 0 0 ${arcX} ${arcY}`} fill="none" stroke={strokeColor} strokeWidth={1} />
          </g>
        );

      case 'mech_trajectory':
        const trajWidth = val1 ? parseFloat(val1) : 120;
        const trajHeight = val2 ? parseFloat(val2) : 60;
        return (
          <g>
            <path d={`M 0 0 Q ${trajWidth / 2} ${-trajHeight * 2} ${trajWidth} 0`} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeDasharray="4 2" />
          </g>
        );

      default:
        return <rect x={-hw} y={-hh} width={size} height={hh * 2} fill="none" stroke={strokeColor} strokeWidth={sw} />;
    }
  })();

  return (
    <g transform={scale !== 1 ? `scale(${scale})` : undefined}>
      {symbolContent}
    </g>
  );
};
