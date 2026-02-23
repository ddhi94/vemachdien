import { ComponentType, CircuitComponent, Wire } from '@/types/circuit';

// Parse circuit notation like R//R1nt(R2//R3)
// // = song song (parallel)
// nt = nối tiếp (series)
// () = grouping

interface ParsedNode {
  type: 'component' | 'series' | 'parallel';
  componentType?: ComponentType;
  label?: string;
  children?: ParsedNode[];
}

function identifyComponent(token: string): { type: ComponentType; label: string; value?: string } {
  let lower = token.toLowerCase();
  let value: string | undefined;

  // Extract value from parentheses like cl(80)
  const match = lower.match(/^([a-zđ]+)\(([^)]+)\)$/i);
  if (match) {
    lower = match[1];
    value = match[2];
  }

  // Cơ học (Ưu tiên kiểm tra trước tránh xung đột, Vd: 'cl' bị lẫn với 'c')
  if (lower === 'lx' || lower.startsWith('lx')) return { type: 'mech_spring', label: token, value };
  if (lower === 'mc' || lower.startsWith('mc')) return { type: 'mech_weight_circle', label: token, value };
  if (lower === 'm' || (lower.startsWith('m') && !lower.startsWith('motor') && (lower.length === 1 || lower.includes('(')))) return { type: 'mech_block', label: token, value };
  if (lower.startsWith('gd')) return { type: 'mech_support', label: token, value };
  if (lower.startsWith('rr')) return { type: 'mech_pulley_fixed', label: token, value };
  if (lower.startsWith('mpn')) return { type: 'mech_inclined_plane', label: token, value };
  if (lower.startsWith('cl')) return { type: 'mech_pendulum', label: token, value };
  if (lower.startsWith('xl')) return { type: 'mech_cart', label: token, value };
  if (lower === 'f' || lower.startsWith('f(') || lower.startsWith('v_')) return { type: 'mech_vector', label: token, value };
  if (lower.startsWith('trục') || lower.startsWith('truc') || lower.startsWith('ox')) return { type: 'mech_axis', label: token, value };
  if (lower === 'oy' || lower.startsWith('oy')) return { type: 'mech_axis_y', label: token, value };
  if (lower.startsWith('dóng') || lower.startsWith('dong') || lower.startsWith('dot')) return { type: 'mech_line_dashed', label: token, value };
  if (lower.startsWith('cung')) return { type: 'mech_arc', label: token, value };
  if (lower.startsWith('ném') || lower.startsWith('nem') || lower.startsWith('parabol')) return { type: 'mech_trajectory', label: token, value };
  if (lower.startsWith('đòn') || lower.startsWith('don') || lower === 'lever') return { type: 'mech_lever', label: token, value };

  // Điện học
  if (lower.startsWith('rb')) return { type: 'variable_resistor', label: token, value };
  if (lower.startsWith('rq')) return { type: 'photoresistor', label: token, value };
  if (lower.startsWith('kd')) return { type: 'switch_closed', label: token, value };
  if (lower.startsWith('km')) return { type: 'switch_open', label: token, value };
  if (lower.startsWith('led')) return { type: 'led', label: token, value };
  if (lower === 'đ' || lower.startsWith('đ')) return { type: 'bulb', label: token, value };
  if (lower.startsWith('r')) return { type: 'resistor', label: token, value };
  if (lower.startsWith('ud') || lower.startsWith('u_doi')) return { type: 'battery', label: token, value };
  if (lower.startsWith('u')) return { type: 'battery_single', label: token, value };
  if (lower.startsWith('c')) return { type: 'capacitor', label: token, value };
  if (lower.startsWith('l')) return { type: 'inductor', label: token, value };
  if (lower === 'a' || lower.startsWith('a')) return { type: 'ammeter', label: token, value };
  if (lower === 'v' || (lower.startsWith('v') && lower.length > 1 && !lower.startsWith('v_'))) return { type: 'voltmeter', label: token, value };
  if (lower.startsWith('dn')) return { type: 'wire_jumper', label: token, value };
  if (lower.startsWith('d')) return { type: 'diode', label: token, value };
  if (lower.startsWith('m') && lower.length > 1) return { type: 'motor', label: token, value };
  if (lower === 'g' || lower.startsWith('g')) return { type: 'generator', label: token, value };
  if (lower.startsWith('ba')) return { type: 'transformer', label: token, value };

  return { type: 'resistor', label: token, value };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    if (input[i] === ' ') { i++; continue; }
    if (input[i] === '(' || input[i] === ')') {
      tokens.push(input[i]);
      i++;
    } else if (input[i] === '/' && input[i + 1] === '/') {
      tokens.push('//');
      i += 2;
    } else if (input.substring(i, i + 2).toLowerCase() === 'nt') {
      // Check if 'nt' is operator: must be after component/closing paren and before component/opening paren
      const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : '';
      const isAfterValue = prevToken !== '//' && prevToken !== 'nt' && prevToken !== '(' && prevToken !== '';
      if (isAfterValue) {
        tokens.push('nt');
        i += 2;
      } else {
        // Part of component name
        let name = '';
        while (i < input.length && input[i] !== '/' && input[i] !== '(' && input[i] !== ')') {
          name += input[i];
          i++;
        }
        if (name) tokens.push(name);
      }
    } else {
      let name = '';
      let parenLevel = 0;
      while (i < input.length) {
        const char = input[i];
        if (char === '(') parenLevel++;
        if (char === ')') parenLevel--;

        if (parenLevel === 0 && (char === '/' || char === ' ' || (char === 'n' && input[i + 1]?.toLowerCase() === 't'))) {
          break;
        }

        name += char;
        i++;
      }
      if (name) tokens.push(name);
    }
  }

  return tokens;
}

function parseExpression(tokens: string[], pos: { index: number }): ParsedNode {
  const seriesItems: ParsedNode[] = [];

  while (pos.index < tokens.length && tokens[pos.index] !== ')') {
    const parallelItems: ParsedNode[] = [];
    parallelItems.push(parseAtom(tokens, pos));

    while (pos.index < tokens.length && tokens[pos.index] === '//') {
      pos.index++;
      parallelItems.push(parseAtom(tokens, pos));
    }

    seriesItems.push(
      parallelItems.length === 1 ? parallelItems[0] : { type: 'parallel', children: parallelItems }
    );

    if (pos.index < tokens.length && tokens[pos.index] === 'nt') {
      pos.index++;
    } else if (pos.index < tokens.length && tokens[pos.index] !== ')' && tokens[pos.index] !== '//') {
      // Implicit series if next is component or '('
      continue;
    } else {
      break;
    }
  }

  return seriesItems.length === 1 ? seriesItems[0] : { type: 'series', children: seriesItems };
}

function parseAtom(tokens: string[], pos: { index: number }): ParsedNode {
  if (pos.index >= tokens.length) return { type: 'component', componentType: 'resistor', label: '?' };

  const token = tokens[pos.index];

  if (token === '(') {
    pos.index++;
    const node = parseExpression(tokens, pos);
    if (pos.index < tokens.length && tokens[pos.index] === ')') pos.index++;
    return node;
  }

  if (token === '//' || token === 'nt' || token === ')') {
    return { type: 'component', componentType: 'resistor', label: '?' };
  }

  pos.index++;
  const comp = identifyComponent(token);
  return { type: 'component', componentType: comp.type, label: comp.label, value: comp.value } as any;
}

// ============ LAYOUT ENGINE ============
// Produces textbook-style schematics like Vietnamese physics textbooks
// - Parallel branches stacked vertically between two vertical bus wires
// - Series components laid out horizontally
// - Clean orthogonal routing

interface LayoutBox {
  width: number;
  height: number;
}

let idCounter = 0;

function getComponentWidth(type: ComponentType, value?: string): number {
  const params = value ? value.split(',').map(s => s.trim()) : [];
  const val1 = params[0];
  const val2 = params[1];
  const scale = val2 ? parseFloat(val2) : 1;

  let baseWidth = 80;
  if (type === 'mech_spring') baseWidth = val1 ? parseFloat(val1) : 60;
  else if (type === 'mech_block' || type === 'mech_weight_circle') baseWidth = 45;
  else if (type === 'mech_support' || type === 'mech_inclined_plane') baseWidth = 80;
  else if (type === 'mech_cart') baseWidth = 60;
  else if (type === 'mech_pulley_fixed' || type === 'mech_pulley_movable') baseWidth = 44;
  else if (type === 'mech_pendulum') baseWidth = 30;
  else if (type === 'mech_vector') baseWidth = 40;
  else if (type === 'mech_axis') baseWidth = val1 ? parseFloat(val1) : 100;
  else if (type === 'mech_arc' || type === 'mech_line_dashed') baseWidth = val1 ? parseFloat(val1) : 60;
  else if (type === 'mech_trajectory') baseWidth = val1 ? parseFloat(val1) : 120;
  else if (type === 'mech_lever') {
    const l1 = val1 ? parseFloat(val1) : 50;
    const l2 = val2 ? parseFloat(val2) : 50;
    baseWidth = l1 + l2;
  }
  else return 80; // Default electrical

  return baseWidth * scale;
}

function measureNode(node: ParsedNode): LayoutBox {
  const COMP_H = 40;
  const SERIES_GAP = node.children?.every(c => c.componentType?.startsWith('mech_')) ? 0 : 20;
  const PARALLEL_GAP = 50;

  if (node.type === 'component') {
    return { width: getComponentWidth(node.componentType!, (node as any).value), height: COMP_H };
  }

  if (node.type === 'series') {
    const children = node.children || [];
    let totalW = 0;
    let maxH = 0;
    children.forEach((c, i) => {
      const m = measureNode(c);
      totalW += m.width + (i > 0 ? SERIES_GAP : 0);
      maxH = Math.max(maxH, m.height);
    });
    return { width: totalW, height: maxH };
  }
  // ... rest of implementation stays logic-consistent

  if (node.type === 'parallel') {
    const children = node.children || [];
    let maxW = 0;
    let totalH = 0;
    children.forEach((c, i) => {
      const m = measureNode(c);
      maxW = Math.max(maxW, m.width);
      totalH += m.height + (i > 0 ? PARALLEL_GAP : 0);
    });
    return { width: maxW + 60, height: totalH }; // +60 for vertical bus bars
  }

  return { width: 80, height: 40 };
}

function layoutNode(
  node: ParsedNode,
  cx: number, // center x
  cy: number, // center y
  components: CircuitComponent[],
  wires: Wire[],
): { leftX: number; rightX: number; topY: number; bottomY: number } {
  const COMP_H = 40;
  const SERIES_GAP = node.children?.every(c => c.componentType?.startsWith('mech_')) ? 0 : 20;
  const PARALLEL_GAP = 50;

  if (node.type === 'component') {
    const compWidth = getComponentWidth(node.componentType!, (node as any).value);
    const comp: CircuitComponent = {
      id: `parsed_${idCounter++}`,
      type: node.componentType || 'resistor',
      x: cx,
      y: cy,
      rotation: 0,
      label: node.label || '',
      value: (node as any).value,
    };
    components.push(comp);
    return {
      leftX: cx - compWidth / 2,
      rightX: cx + compWidth / 2,
      topY: cy - COMP_H / 2,
      bottomY: cy + COMP_H / 2,
    };
  }

  if (node.type === 'series') {
    const children = node.children || [];
    const measurements = children.map(c => measureNode(c));
    const totalW = measurements.reduce((sum, m, i) => sum + m.width + (i > 0 ? SERIES_GAP : 0), 0);

    let currentX = cx - totalW / 2;
    let overallTop = cy;
    let overallBottom = cy;
    const childBounds: { leftX: number; rightX: number; topY: number; bottomY: number }[] = [];

    children.forEach((child, i) => {
      const m = measurements[i];
      const childCx = currentX + m.width / 2;
      const bounds = layoutNode(child, childCx, cy, components, wires);
      childBounds.push(bounds);
      overallTop = Math.min(overallTop, bounds.topY);
      overallBottom = Math.max(overallBottom, bounds.bottomY);

      // Connect to previous child with wire ONLY if there is a gap
      if (i > 0 && SERIES_GAP > 0) {
        const prev = childBounds[i - 1];
        wires.push({
          id: `wire_${idCounter++}`,
          points: [
            { x: prev.rightX, y: cy },
            { x: bounds.leftX, y: cy },
          ],
        });
      }

      currentX += m.width + SERIES_GAP;
    });

    return {
      leftX: childBounds[0]?.leftX ?? cx,
      rightX: childBounds[childBounds.length - 1]?.rightX ?? cx,
      topY: overallTop,
      bottomY: overallBottom,
    };
  }

  if (node.type === 'parallel') {
    const children = node.children || [];
    const measurements = children.map(c => measureNode(c));
    const maxW = Math.max(...measurements.map(m => m.width));
    const totalH = measurements.reduce((sum, m, i) => sum + m.height + (i > 0 ? PARALLEL_GAP : 0), 0);

    const busLeftX = cx - maxW / 2 - 30;
    const busRightX = cx + maxW / 2 + 30;

    let currentY = cy - totalH / 2;
    const branchYs: number[] = [];

    children.forEach((child, i) => {
      const m = measurements[i];
      const branchCy = currentY + m.height / 2;
      branchYs.push(branchCy);

      const bounds = layoutNode(child, cx, branchCy, components, wires);

      // Wire from left bus to child left
      if (bounds.leftX > busLeftX + 5) {
        wires.push({
          id: `wire_${idCounter++}`,
          points: [
            { x: busLeftX, y: branchCy },
            { x: bounds.leftX, y: branchCy },
          ],
        });
      }

      // Wire from child right to right bus
      if (bounds.rightX < busRightX - 5) {
        wires.push({
          id: `wire_${idCounter++}`,
          points: [
            { x: bounds.rightX, y: branchCy },
            { x: busRightX, y: branchCy },
          ],
        });
      }

      currentY += m.height + PARALLEL_GAP;
    });

    // Draw vertical bus bars
    const topBranchY = branchYs[0];
    const bottomBranchY = branchYs[branchYs.length - 1];

    // Left vertical bus
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: busLeftX, y: topBranchY },
        { x: busLeftX, y: bottomBranchY },
      ],
    });

    // Right vertical bus
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: busRightX, y: topBranchY },
        { x: busRightX, y: bottomBranchY },
      ],
    });

    // Connect bus to center y if bus doesn't reach it
    if (topBranchY > cy) {
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: busLeftX, y: cy },
          { x: busLeftX, y: topBranchY },
        ],
      });
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: busRightX, y: cy },
          { x: busRightX, y: topBranchY },
        ],
      });
    }
    if (bottomBranchY < cy) {
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: busLeftX, y: bottomBranchY },
          { x: busLeftX, y: cy },
        ],
      });
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: busRightX, y: bottomBranchY },
          { x: busRightX, y: cy },
        ],
      });
    }

    return {
      leftX: busLeftX,
      rightX: busRightX,
      topY: topBranchY - COMP_H / 2,
      bottomY: bottomBranchY + COMP_H / 2,
    };
  }

  return { leftX: cx, rightX: cx, topY: cy, bottomY: cy };
}

export function parseCircuitNotation(input: string): { components: CircuitComponent[]; wires: Wire[] } {
  if (!input.trim()) return { components: [], wires: [] };

  try {
    idCounter = 0;
    const tokens = tokenize(input.trim());
    const pos = { index: 0 };
    const tree = parseExpression(tokens, pos);

    const components: CircuitComponent[] = [];
    const wires: Wire[] = [];

    const measure = measureNode(tree);
    const cx = 100 + measure.width / 2;
    const cy = 300;

    const bounds = layoutNode(tree, cx, cy, components, wires);

    // Add terminal points A and B
    const terminalAx = bounds.leftX - 40;
    const terminalBx = bounds.rightX + 40;

    // Wire to terminal A
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: terminalAx, y: cy },
        { x: bounds.leftX, y: cy },
      ],
    });

    // Wire to terminal B
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: bounds.rightX, y: cy },
        { x: terminalBx, y: cy },
      ],
    });

    // Add A and B label components (use special markers)
    // We'll just add dots/labels via special components
    // Actually let's add them as text labels by using "battery" type with label A/B
    // Better: just return the wires and let the canvas show them

    return { components, wires };
  } catch (e) {
    console.error('Parse error:', e);
    return { components: [], wires: [] };
  }
}
