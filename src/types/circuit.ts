export type ComponentType =
  | 'resistor'       // Điện trở R
  | 'variable_resistor' // Biến trở Rb
  | 'capacitor'      // Tụ điện C
  | 'inductor'       // Cuộn dây L
  | 'battery'        // Nguồn điện U
  | 'switch_open'    // Khóa K mở
  | 'switch_closed'  // Khóa K đóng
  | 'bulb'           // Bóng đèn
  | 'ammeter'        // Ampe kế A
  | 'voltmeter'      // Vôn kế V
  | 'fuse'           // Cầu chì
  | 'bell'           // Chuông điện
  | 'diode'          // Điốt
  | 'led'            // Đèn LED
  | 'wire';          // Dây dẫn

export interface Point {
  x: number;
  y: number;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  label: string;
  value?: string;
  selected?: boolean;
}

export interface Wire {
  id: string;
  points: Point[];
  selected?: boolean;
}

export interface CircuitState {
  components: CircuitComponent[];
  wires: Wire[];
  selectedIds: string[];
}

export interface PaletteItem {
  type: ComponentType;
  label: string;
  shortLabel: string;
  category: 'passive' | 'source' | 'switch' | 'meter' | 'other';
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'battery', label: 'Nguồn điện', shortLabel: 'U', category: 'source' },
  { type: 'resistor', label: 'Điện trở', shortLabel: 'R', category: 'passive' },
  { type: 'variable_resistor', label: 'Biến trở', shortLabel: 'Rb', category: 'passive' },
  { type: 'capacitor', label: 'Tụ điện', shortLabel: 'C', category: 'passive' },
  { type: 'inductor', label: 'Cuộn dây', shortLabel: 'L', category: 'passive' },
  { type: 'bulb', label: 'Bóng đèn', shortLabel: 'Đ', category: 'other' },
  { type: 'switch_open', label: 'Khóa K (mở)', shortLabel: 'Km', category: 'switch' },
  { type: 'switch_closed', label: 'Khóa K (đóng)', shortLabel: 'Kd', category: 'switch' },
  { type: 'ammeter', label: 'Ampe kế', shortLabel: 'A', category: 'meter' },
  { type: 'voltmeter', label: 'Vôn kế', shortLabel: 'V', category: 'meter' },
  { type: 'fuse', label: 'Cầu chì', shortLabel: 'CC', category: 'other' },
  { type: 'bell', label: 'Chuông điện', shortLabel: 'Ch', category: 'other' },
  { type: 'diode', label: 'Điốt', shortLabel: 'D', category: 'other' },
  { type: 'led', label: 'Đèn LED', shortLabel: 'LED', category: 'other' },
];

export const GRID_SIZE = 20;
export const SNAP_SIZE = 20;
