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
  value?: string,
  hideNodes?: boolean,
  hideTerminals?: boolean,
  flipped: boolean = false
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
          <g transform={flipped ? "translate(-12, 12) scale(-1, 1) translate(12, -12)" : ""}>
            <text x={-12} y={12} fontSize={8} fill={strokeColor}>M</text>
          </g>
          <g transform={flipped ? "translate(8, 12) scale(-1, 1) translate(-8, -12)" : ""}>
            <text x={8} y={12} fontSize={8} fill={strokeColor}>N</text>
          </g>
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
          <g transform={flipped ? "translate(-6, -15) scale(-1, 1) translate(6, 15)" : ""}>
            <text x={-6} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="end">+</text>
          </g>
          <g transform={flipped ? "translate(6, -15) scale(-1, 1) translate(-6, 15)" : ""}>
            <text x={6} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="start">−</text>
          </g>
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
          <g transform={flipped ? "translate(-14, -15) scale(-1, 1) translate(14, 15)" : ""}>
            <text x={-14} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="end">+</text>
          </g>
          <g transform={flipped ? "translate(14, -15) scale(-1, 1) translate(-14, 15)" : ""}>
            <text x={14} y={-15} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="start">−</text>
          </g>
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
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={14} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
          </g>
        </g>
      );

    case 'terminal_negative':
      return (
        <g>
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={14} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
          </g>
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
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={-15} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">K</text>
          </g>
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
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={-10} fontSize={12} fontWeight="bold" fill={strokeColor} textAnchor="middle">K</text>
          </g>
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
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">A</text>
          </g>
          {!hideTerminals && (
            <>
              <g transform={flipped ? "translate(-20, -5) scale(-1, 1) translate(20, 5)" : ""}>
                <text x={-20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
              </g>
              <g transform={flipped ? "translate(20, -5) scale(-1, 1) translate(-20, 5)" : ""}>
                <text x={20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
              </g>
            </>
          )}
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'voltmeter':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">V</text>
          </g>
          {!hideTerminals && (
            <>
              <g transform={flipped ? "translate(-20, -5) scale(-1, 1) translate(20, 5)" : ""}>
                <text x={-20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">+</text>
              </g>
              <g transform={flipped ? "translate(20, -5) scale(-1, 1) translate(-20, 5)" : ""}>
                <text x={20} y={-5} fontSize={10} fontWeight="bold" fill={strokeColor} textAnchor="middle">−</text>
              </g>
            </>
          )}
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
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">M</text>
          </g>
          <line x1={14} y1={0} x2={hw} y2={0} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );

    case 'generator':
      return (
        <g>
          <line x1={-hw} y1={0} x2={-14} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={14} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={5} fontSize={14} fontWeight="bold" fill={strokeColor} textAnchor="middle">G</text>
          </g>
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
    // wire_jumper: handled by the dynamic case below (line ~452)

    case 'mech_support': {
      const supportScale = value ? parseFloat((value.split(',')[1] || '1').trim()) || 1 : 1;
      return (
        <g transform={`scale(${supportScale})`}>
          <line x1={-20} y1={0} x2={20} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
          {[-15, -5, 5, 15].map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x + 5} y2={-8} stroke={strokeColor} strokeWidth={1} />
          ))}
          <circle cx={0} cy={0} r={2} fill={strokeColor} />
        </g>
      );
    }

    case 'mech_spring': {
      const springParams = value ? value.split(',').map(s => s.trim()) : [];
      const springLen = parseFloat(springParams[0]) || 60;
      const halfLen = springLen / 2;
      const straightLen = Math.min(15, springLen * 0.15); // Max 15px straight part
      const coilSectionLen = Math.max(0, springLen - 2 * straightLen);
      let springPath = `M ${-halfLen} 0 L ${-halfLen + straightLen} 0`;
      const coils = 6;
      const step = coilSectionLen / (coils * 2);
      const amplitude = 6;
      let cx = -halfLen + straightLen;
      for (let i = 0; i < coils * 2; i++) {
        cx += step;
        const cy = (i % 2 === 0) ? -amplitude : amplitude;
        springPath += ` L ${cx} ${cy}`;
      }
      springPath += ` L ${halfLen} 0`;
      return (
        <g>
          <path d={springPath} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    }

    case 'mech_block': {
      const blockScale = value ? parseFloat((value.split(',')[1] || '1').trim()) || 1 : 1;
      return (
        <g transform={`scale(${blockScale})`}>
          <rect x={-15} y={-15} width={30} height={30} fill="#f0f4f8" stroke={strokeColor} strokeWidth={sw} rx={2} />
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={4} fontSize={14} fontWeight="bold" fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">m</text>
          </g>
        </g>
      );
    }

    case 'mech_weight_circle': {
      const circleScale = value ? parseFloat((value.split(',')[1] || '1').trim()) || 1 : 1;
      return (
        <g transform={`scale(${circleScale})`}>
          <circle cx={0} cy={0} r={15} fill="#f0f4f8" stroke={strokeColor} strokeWidth={sw} />
          <g transform={flipped ? "scale(-1, 1)" : ""}>
            <text x={0} y={4} fontSize={12} fontWeight="bold" fontFamily="serif" fontStyle="italic" fill={strokeColor} textAnchor="middle">mc</text>
          </g>
        </g>
      );
    }

    case 'mech_pulley_fixed': {
      const pfParams = value ? value.split(',').map(s => s.trim()) : [];
      const R = 16;
      // params: lenL, lenR, angL, angR, lenT, angT
      const pfLenL = parseFloat(pfParams[0]) || 25;
      const pfLenR = parseFloat(pfParams[1]) || pfLenL;
      const pfAngL = parseFloat(pfParams[2]) || 0;
      const pfAngR = parseFloat(pfParams[3]) || 0;
      const pfLenT = parseFloat(pfParams[4]) || 25;
      const pfAngT = parseFloat(pfParams[5]) || 0;

      const radL = (pfAngL * Math.PI) / 180;
      const radR = (pfAngR * Math.PI) / 180;
      const radT = (pfAngT * Math.PI) / 180;

      // Fixed: left/right go DOWN, top goes UP
      const tLx = -R * Math.cos(radL), tLy = -R * Math.sin(radL);
      const eLx = tLx - pfLenL * Math.sin(radL), eLy = tLy + pfLenL * Math.cos(radL);
      const tRx = R * Math.cos(radR), tRy = -R * Math.sin(radR);
      const eRx = tRx + pfLenR * Math.sin(radR), eRy = tRy + pfLenR * Math.cos(radR);
      const eTx = pfLenT * Math.sin(radT), eTy = -pfLenT * Math.cos(radT);

      return (
        <g>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <circle cx={0} cy={0} r={R} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0`} fill="none" stroke={strokeColor} strokeWidth={sw} strokeDasharray="4 2" />
          <line x1={tLx} y1={tLy} x2={eLx} y2={eLy} stroke={strokeColor} strokeWidth={sw} />
          <line x1={tRx} y1={tRy} x2={eRx} y2={eRy} stroke={strokeColor} strokeWidth={sw} />
          <line x1={0} y1={-R} x2={eTx} y2={eTy} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );
    }

    case 'mech_pulley_movable': {
      const pmParams = value ? value.split(',').map(s => s.trim()) : [];
      const R = 16;
      // params: lenL, lenR, lenB, angL, angR, angB
      const pmLenL = parseFloat(pmParams[0]) || 25;
      const pmLenR = parseFloat(pmParams[1]) || pmLenL;
      const pmLenB = parseFloat(pmParams[2]) || 30;
      const pmAngL = parseFloat(pmParams[3]) || 0;
      const pmAngR = parseFloat(pmParams[4]) || 0;
      const pmAngB = parseFloat(pmParams[5]) || 0;

      const radL = (pmAngL * Math.PI) / 180;
      const radR = (pmAngR * Math.PI) / 180;
      const radB = (pmAngB * Math.PI) / 180;

      // Movable: left/right go UP, bottom goes DOWN
      const tLx = -R * Math.cos(radL), tLy = R * Math.sin(radL);
      const eLx = tLx - pmLenL * Math.sin(radL), eLy = tLy - pmLenL * Math.cos(radL);
      const tRx = R * Math.cos(radR), tRy = R * Math.sin(radR);
      const eRx = tRx + pmLenR * Math.sin(radR), eRy = tRy - pmLenR * Math.cos(radR);
      const eBx = pmLenB * Math.sin(radB), eBy = pmLenB * Math.cos(radB);

      return (
        <g>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <circle cx={0} cy={0} r={R} fill="#e2e8f0" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={0} cy={0} r={4} fill={strokeColor} />
          <path d={`M ${-R} 0 A ${R} ${R} 0 0 0 ${R} 0`} fill="none" stroke={strokeColor} strokeWidth={sw} strokeDasharray="4 2" />
          <line x1={tLx} y1={tLy} x2={eLx} y2={eLy} stroke={strokeColor} strokeWidth={sw} />
          <line x1={tRx} y1={tRy} x2={eRx} y2={eRy} stroke={strokeColor} strokeWidth={sw} />
          <line x1={0} y1={R} x2={eBx} y2={eBy} stroke={strokeColor} strokeWidth={sw} />
        </g>
      );
    }

    case 'mech_inclined_plane': {
      const ipParams = value ? value.split(',').map(s => s.trim()) : [];
      const angle = parseFloat(ipParams[0]) || 30;
      const ipScale = parseFloat(ipParams[1]) || 1;
      const angleDisplay = ipParams[2] || 'bottom'; // 'bottom', 'top', 'none'

      const angleRad = (angle * Math.PI) / 180;
      const baseLen = 60;
      const height = baseLen * Math.tan(angleRad);
      const autoScale = height > 40 ? 40 / height : 1;
      const drawBase = baseLen * autoScale;
      const drawHeight = height * autoScale;

      const arcR = Math.min(12, drawBase * 0.8, Math.hypot(drawBase, drawHeight) * 0.4);

      // Bottom angle geometry
      const blX = -drawBase / 2;
      const blY = drawHeight / 2;
      const bottomArcPath = `M ${blX + arcR} ${blY} A ${arcR} ${arcR} 0 0 0 ${blX + arcR * Math.cos(angleRad)} ${blY - arcR * Math.sin(angleRad)}`;

      // Top angle geometry
      const tX = drawBase / 2;
      const tY = -drawHeight / 2;
      const topAngleRad = Math.PI / 2 - angleRad;
      const topArcPath = `M ${tX} ${tY + arcR} A ${arcR} ${arcR} 0 0 1 ${tX - arcR * Math.sin(topAngleRad)} ${tY + arcR * Math.cos(topAngleRad)}`;

      return (
        <g transform={`scale(${ipScale})`}>
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="transparent" strokeWidth={sw} />
          <polygon points={`${blX},${blY} ${tX},${blY} ${tX},${tY}`} fill="#f8fafc" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />

          {angleDisplay !== 'none' && angleDisplay !== 'top' && (
            <>
              <path d={bottomArcPath} fill="none" stroke={strokeColor} strokeWidth={1} />
              <g transform={flipped ? `translate(${blX + arcR + 2}, ${blY - 2}) scale(-1, 1) translate(${-blX - arcR - 2}, ${-blY + 2})` : ""}>
                <text x={blX + arcR + 2} y={blY - 2} fontSize={9} fill={strokeColor} fontStyle="italic">{parseFloat(angle.toFixed(1))}°</text>
              </g>
            </>
          )}

          {angleDisplay === 'top' && (
            <>
              <path d={topArcPath} fill="none" stroke={strokeColor} strokeWidth={1} />
              <g transform={flipped ? `translate(${tX - arcR / 2 - 2}, ${tY + arcR + 8}) scale(-1, 1) translate(${-tX + arcR / 2 + 2}, ${-tY - arcR - 8})` : ""}>
                <text x={tX - arcR / 2 - 2} y={tY + arcR + 8} fontSize={9} fill={strokeColor} fontStyle="italic" textAnchor="end">{parseFloat((90 - angle).toFixed(1))}°</text>
              </g>
            </>
          )}
        </g>
      );
    }

    case 'mech_pendulum': {
      const pendParams = value ? value.split(',').map(s => s.trim()) : [];
      const pendLen = parseFloat(pendParams[0]) || 50;
      const pendScale = parseFloat(pendParams[1]) || 1;
      return (
        <g transform={`scale(${pendScale})`}>
          <line x1={-15} y1={0} x2={15} y2={0} stroke={strokeColor} strokeWidth={sw} />
          {[-12, -6, 0, 6, 12].map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x + 3} y2={-5} stroke={strokeColor} strokeWidth={1} />
          ))}
          <line x1={0} y1={0} x2={0} y2={pendLen} stroke={strokeColor} strokeWidth={1} />
          <circle cx={0} cy={pendLen} r={8} fill="#94a3b8" stroke={strokeColor} strokeWidth={sw} />
        </g>
      );
    }

    case 'mech_cart': {
      const cartScale = value ? parseFloat((value.split(',')[1] || '1').trim()) || 1 : 1;
      return (
        <g transform={`scale(${cartScale})`}>
          <rect x={-20} y={-12} width={40} height={15} fill="#f1f5f9" stroke={strokeColor} strokeWidth={sw} rx={2} />
          <circle cx={-12} cy={7} r={4} fill="white" stroke={strokeColor} strokeWidth={sw} />
          <circle cx={12} cy={7} r={4} fill="white" stroke={strokeColor} strokeWidth={sw} />
        </g>
      );
    }

    case 'mech_vector': {
      const vecParams = value ? value.split(',').map(s => s.trim()) : [];
      const vecLen = parseFloat(vecParams[1]) || 40;
      return (
        <g>
          <line x1={0} y1={0} x2={vecLen} y2={0} stroke={strokeColor} strokeWidth={sw + 1} />
          <polygon points={`${vecLen},0 ${vecLen - 8},-4 ${vecLen - 8},4`} fill={strokeColor} />
        </g>
      );
    }

    case 'mech_axis':
      const axisLen = value ? parseFloat(value) : 100;
      return (
        <g>
          <line x1={0} y1={0} x2={axisLen} y2={0} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`${axisLen},0 ${axisLen - 8},-4 ${axisLen - 8},4`} fill={strokeColor} />
        </g>
      );

    case 'mech_axis_y': {
      const axisYLen = value ? parseFloat(value) : 100;
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-axisYLen} stroke={strokeColor} strokeWidth={sw} />
          <polygon points={`0,${-axisYLen} -4,${-axisYLen + 8} 4,${-axisYLen + 8}`} fill={strokeColor} />
        </g>
      );
    }

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

    case 'wire_jumper': {
      const jumperLen = value ? parseFloat(value.split(',')[0] || '60') : 60;
      return (
        <g>
          {/* Main wire line — stretches between the two terminals */}
          <line x1={0} y1={0} x2={jumperLen} y2={0} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" />
          {/* Terminal circles — hidden when hideNodes is on */}
          {!hideNodes && (
            <>
              <circle cx={0} cy={0} r={8} fill="none" stroke={strokeColor} strokeWidth={1} opacity={0.25} />
              <circle cx={0} cy={0} r={5} fill={strokeColor} />
              <circle cx={jumperLen} cy={0} r={8} fill="none" stroke={strokeColor} strokeWidth={1} opacity={0.25} />
              <circle cx={jumperLen} cy={0} r={5} fill={strokeColor} />
            </>
          )}
        </g>
      );
    }

    default:
      return <rect x={-hw} y={-hh} width={size} height={hh * 2} fill="none" stroke={strokeColor} strokeWidth={sw} />;
  }
};

export const getPulleyKinematics = (params: string[], isMovable: boolean) => {
  const R = 16;
  const p0 = parseFloat(params[0]); const lenL = isNaN(p0) ? 25 : p0;
  const p1 = parseFloat(params[1]); const lenR = isNaN(p1) ? lenL : p1;

  if (isMovable) {
    const p2 = parseFloat(params[2]); const lenB = isNaN(p2) ? 30 : p2;
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
    const p4 = parseFloat(params[4]); const lenT = isNaN(p4) ? 25 : p4;
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
