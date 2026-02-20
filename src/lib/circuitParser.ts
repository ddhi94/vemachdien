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

function identifyComponent(token: string): { type: ComponentType; label: string } {
  const lower = token.toLowerCase();
  
  if (lower.startsWith('rb')) return { type: 'variable_resistor', label: token };
  if (lower.startsWith('kd')) return { type: 'switch_closed', label: token };
  if (lower.startsWith('km')) return { type: 'switch_open', label: token };
  if (lower.startsWith('led')) return { type: 'led', label: token };
  if (lower === 'đ' || lower.startsWith('đ')) return { type: 'bulb', label: token };
  if (lower.startsWith('r')) return { type: 'resistor', label: token };
  if (lower.startsWith('u')) return { type: 'battery', label: token };
  if (lower.startsWith('c')) return { type: 'capacitor', label: token };
  if (lower.startsWith('l')) return { type: 'inductor', label: token };
  if (lower === 'a' || lower.startsWith('a')) return { type: 'ammeter', label: token };
  if (lower === 'v' || lower.startsWith('v')) return { type: 'voltmeter', label: token };
  if (lower.startsWith('d')) return { type: 'diode', label: token };
  
  return { type: 'resistor', label: token };
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
      while (i < input.length && input[i] !== '/' && input[i] !== '(' && input[i] !== ')' && input[i] !== ' ') {
        // Check for 'nt' operator mid-token
        if (input[i].toLowerCase() === 'n' && i + 1 < input.length && input[i + 1].toLowerCase() === 't') {
          // Check if what we have so far is a component name
          if (name.length > 0) {
            // Check what follows 'nt' - if it's another component or '(', treat as operator
            const afterNt = i + 2 < input.length ? input[i + 2] : '';
            if (afterNt === '(' || afterNt === '' || /[a-zA-ZĐđ]/.test(afterNt)) {
              break; // Stop here, 'nt' will be picked up as operator
            }
          }
        }
        name += input[i];
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
  return { type: 'component', componentType: comp.type, label: comp.label };
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

function measureNode(node: ParsedNode): LayoutBox {
  const COMP_W = 80; // component width including leads
  const COMP_H = 40; // single component height
  const SERIES_GAP = 20; // gap between series items
  const PARALLEL_GAP = 50; // gap between parallel branches
  
  if (node.type === 'component') {
    return { width: COMP_W, height: COMP_H };
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
  const COMP_W = 80;
  const COMP_H = 40;
  const SERIES_GAP = 20;
  const PARALLEL_GAP = 50;
  
  if (node.type === 'component') {
    const comp: CircuitComponent = {
      id: `parsed_${idCounter++}`,
      type: node.componentType || 'resistor',
      x: cx,
      y: cy,
      rotation: 0,
      label: node.label || '',
    };
    components.push(comp);
    return {
      leftX: cx - COMP_W / 2 + 10, // connection point left (where leads end)
      rightX: cx + COMP_W / 2 - 10,
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
      
      // Connect to previous child with wire
      if (i > 0) {
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
    
    // Input/output wires at center height
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: busLeftX - 30, y: cy },
        { x: busLeftX, y: cy },
      ],
    });
    
    // Connect bus to center if needed (vertical segments from cy to bus)
    if (topBranchY < cy) {
      // cy is somewhere between branches - the bus already covers it
    } else {
      // Bus might not reach cy
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: busLeftX, y: cy },
          { x: busLeftX, y: topBranchY },
        ],
      });
    }
    
    wires.push({
      id: `wire_${idCounter++}`,
      points: [
        { x: busRightX, y: cy },
        { x: busRightX + 30, y: cy },
      ],
    });
    
    return {
      leftX: busLeftX - 30,
      rightX: busRightX + 30,
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
