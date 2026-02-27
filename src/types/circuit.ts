export type ComponentType =
  | 'resistor'       // Điện trở R
  | 'variable_resistor' // Biến trở Rb
  | 'capacitor'      // Tụ điện C
  | 'inductor'       // Cuộn dây L
  | 'battery'        // Nguồn điện đôi U
  | 'battery_single' // Nguồn điện đơn
  | 'switch_open'    // Khóa K mở
  | 'switch_closed'  // Khóa K đóng
  | 'bulb'           // Bóng đèn
  | 'ammeter'        // Ampe kế A
  | 'voltmeter'      // Vôn kế V
  | 'fuse'           // Cầu chì
  | 'bell'           // Chuông điện
  | 'diode'          // Điốt
  | 'led'            // Đèn LED
  | 'junction'       // Điểm nối A, B, C, D
  | 'terminal_positive' // Cực dương +
  | 'terminal_negative' // Cực âm −
  | 'wire_jumper'    // Dây nối mạch
  | 'wire'           // Dây dẫn
  // Ký hiệu điện học nâng cao
  | 'motor'          // Động cơ điện M
  | 'generator'      // Máy phát điện G
  | 'ground'         // Nối đất
  | 'photoresistor'  // Quang trở
  | 'transformer'    // Biến áp
  // Ký hiệu cơ học
  | 'mech_support'   // Điểm tựa / Mặt phẳng cố định
  | 'mech_spring'    // Lò xo
  | 'mech_block'     // Vật nặng m
  | 'mech_pulley_fixed' // Ròng rọc cố định
  | 'mech_pulley_movable' // Ròng rọc động
  | 'mech_inclined_plane' // Mặt phẳng nghiêng
  | 'mech_pendulum'  // Con lắc đơn
  | 'mech_cart'      // Xe lăn
  | 'mech_weight_circle' // Vật nặng hình tròn
  | 'mech_vector'    // Vectơ lực / Vận tốc
  | 'mech_axis'      // Trục tọa độ Ox
  | 'mech_axis_y'    // Trục tọa độ Oy
  | 'mech_line_dashed' // Đường đứt nét
  | 'mech_arc'       // Cung tròn đánh dấu góc
  | 'mech_trajectory'// Quỹ đạo ném
  | 'mech_lever';    // Đòn bẩy

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
  labelOffset?: Point; // Used for dragging just the label text relative to the component
  value?: string;
  selected?: boolean;
  flipped?: boolean; // Lật ngang (mirror theo trục Y)
  hideTerminals?: boolean; // Ẩn cực dương/âm trên Ampe kế/Vôn kế
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
  category: 'passive' | 'source' | 'switch' | 'meter' | 'other' | 'point' | 'mechanic';
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'terminal_positive', label: '+', shortLabel: '+', category: 'point' },
  { type: 'terminal_negative', label: '−', shortLabel: '−', category: 'point' },
  { type: 'battery_single', label: 'Nguồn đơn', shortLabel: 'U₁', category: 'source' },
  { type: 'battery', label: 'Nguồn đôi', shortLabel: 'U₂', category: 'source' },
  { type: 'wire_jumper', label: 'Dây nối', shortLabel: 'dn', category: 'source' },
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
  { type: 'junction', label: 'Điểm A', shortLabel: 'A', category: 'point' },
  { type: 'junction', label: 'Điểm B', shortLabel: 'B', category: 'point' },
  { type: 'junction', label: 'Điểm C', shortLabel: 'C', category: 'point' },
  { type: 'junction', label: 'Điểm D', shortLabel: 'D', category: 'point' },
  { type: 'junction', label: 'Điểm E', shortLabel: 'E', category: 'point' },
  { type: 'junction', label: 'Điểm M', shortLabel: 'M', category: 'point' },
  { type: 'junction', label: 'Điểm N', shortLabel: 'N', category: 'point' },
  // Nâng cao (Điện)
  { type: 'motor', label: 'Động cơ', shortLabel: 'M', category: 'other' },
  { type: 'generator', label: 'Máy phát', shortLabel: 'G', category: 'source' },
  { type: 'photoresistor', label: 'Quang trở', shortLabel: 'Rq', category: 'passive' },
  { type: 'transformer', label: 'Biến áp', shortLabel: 'BA', category: 'other' },
  { type: 'ground', label: 'Nối đất', shortLabel: 'Gnd', category: 'point' },
  // Cơ học
  { type: 'mech_block', label: 'Vật khối lượng m', shortLabel: 'm', category: 'mechanic' },
  { type: 'mech_weight_circle', label: 'Vật tròn', shortLabel: 'mc', category: 'mechanic' },
  { type: 'mech_spring', label: 'Lò xo', shortLabel: 'k', category: 'mechanic' },
  { type: 'mech_support', label: 'Giá đỡ cố định', shortLabel: 'Giá', category: 'mechanic' },
  { type: 'mech_pulley_fixed', label: 'Ròng rọc cố định', shortLabel: 'RRc', category: 'mechanic' },
  { type: 'mech_pulley_movable', label: 'Ròng rọc động', shortLabel: 'RRđ', category: 'mechanic' },
  { type: 'mech_inclined_plane', label: 'Mặt phẳng nghiêng', shortLabel: 'MPN', category: 'mechanic' },
  { type: 'mech_pendulum', label: 'Con lắc đơn', shortLabel: 'Con lắc', category: 'mechanic' },
  { type: 'mech_cart', label: 'Xe lăn', shortLabel: 'Xe', category: 'mechanic' },
  { type: 'mech_vector', label: 'Vectơ lực', shortLabel: 'F⃗', category: 'mechanic' },
  { type: 'mech_axis', label: 'Trục tọa độ Ox', shortLabel: 'Ox', category: 'mechanic' },
  { type: 'mech_axis_y', label: 'Trục tọa độ Oy', shortLabel: 'Oy', category: 'mechanic' },
  { type: 'mech_line_dashed', label: 'Đường đứt nét', shortLabel: '--', category: 'mechanic' },
  { type: 'mech_arc', label: 'Cung góc α', shortLabel: '∠', category: 'mechanic' },
  { type: 'mech_trajectory', label: 'Quỹ đạo ném', shortLabel: 'Parabol', category: 'mechanic' },
];

export const GRID_SIZE = 20;
export const SNAP_SIZE = 20;
