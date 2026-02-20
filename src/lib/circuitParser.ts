import { ComponentType, CircuitComponent, Wire } from '@/types/circuit';

// Parse circuit notation like R//R1nt(R2//R3)
// // = song song (parallel)
// nt = nối tiếp (series)
// () = grouping
// Component types: R=resistor, U=battery, C=capacitor, Rb=variable_resistor, 
// L=inductor, Kd=switch_closed, Km=switch_open, A=ammeter, V=voltmeter, D=diode

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
      tokens.push('nt');
      i += 2;
    } else {
      // Read component name
      let name = '';
      while (i < input.length && input[i] !== '/' && input[i] !== '(' && input[i] !== ')' && 
             input.substring(i, i + 2).toLowerCase() !== 'nt' &&
             // Don't consume 'nt' that's part of operator
             !(input[i].toLowerCase() === 'n' && i + 1 < input.length && input[i + 1].toLowerCase() === 't' && 
               // Check if this 'nt' is an operator (preceded by a component or ')' and followed by component or '(')
               (name.length > 0 || (tokens.length > 0 && tokens[tokens.length - 1] !== '//' && tokens[tokens.length - 1] !== 'nt')))) {
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
  
  while (pos.index < tokens.length) {
    const parallelItems: ParsedNode[] = [];
    
    // Parse first item of potential parallel group
    parallelItems.push(parseAtom(tokens, pos));
    
    // Check for parallel operator
    while (pos.index < tokens.length && tokens[pos.index] === '//') {
      pos.index++; // skip //
      parallelItems.push(parseAtom(tokens, pos));
    }
    
    if (parallelItems.length === 1) {
      seriesItems.push(parallelItems[0]);
    } else {
      seriesItems.push({ type: 'parallel', children: parallelItems });
    }
    
    // Check for series operator or end
    if (pos.index < tokens.length && tokens[pos.index] === 'nt') {
      pos.index++; // skip nt
      continue;
    }
    
    // If next token is a component or '(', it's implicit series
    if (pos.index < tokens.length && tokens[pos.index] !== ')' && tokens[pos.index] !== '//' && tokens[pos.index] !== 'nt') {
      // Check if next is actually a parallel operator after this
      continue;
    }
    
    break;
  }
  
  if (seriesItems.length === 1) return seriesItems[0];
  return { type: 'series', children: seriesItems };
}

function parseAtom(tokens: string[], pos: { index: number }): ParsedNode {
  if (pos.index >= tokens.length) {
    return { type: 'component', componentType: 'resistor', label: '?' };
  }
  
  const token = tokens[pos.index];
  
  if (token === '(') {
    pos.index++; // skip (
    const node = parseExpression(tokens, pos);
    if (pos.index < tokens.length && tokens[pos.index] === ')') {
      pos.index++; // skip )
    }
    return node;
  }
  
  if (token === '//' || token === 'nt' || token === ')') {
    return { type: 'component', componentType: 'resistor', label: '?' };
  }
  
  pos.index++;
  const comp = identifyComponent(token);
  return { type: 'component', componentType: comp.type, label: comp.label };
}

// Layout the parsed tree into components and wires
interface LayoutResult {
  components: CircuitComponent[];
  wires: Wire[];
  width: number;
  height: number;
}

let idCounter = 0;

function layoutNode(
  node: ParsedNode,
  startX: number,
  startY: number,
  compSize: number = 80,
  gap: number = 40
): LayoutResult {
  const components: CircuitComponent[] = [];
  const wires: Wire[] = [];
  
  if (node.type === 'component') {
    const comp: CircuitComponent = {
      id: `parsed_${idCounter++}`,
      type: node.componentType || 'resistor',
      x: startX + compSize / 2,
      y: startY,
      rotation: 0,
      label: node.label || '',
    };
    components.push(comp);
    return { components, wires, width: compSize, height: compSize / 2 };
  }
  
  if (node.type === 'series') {
    let currentX = startX;
    let maxHeight = 0;
    const children = node.children || [];
    
    children.forEach((child, i) => {
      const result = layoutNode(child, currentX, startY, compSize, gap);
      components.push(...result.components);
      wires.push(...result.wires);
      
      if (i > 0) {
        // Connect with wire
        wires.push({
          id: `wire_${idCounter++}`,
          points: [
            { x: currentX - gap / 2, y: startY },
            { x: currentX, y: startY }
          ]
        });
      }
      
      currentX += result.width + gap;
      maxHeight = Math.max(maxHeight, result.height);
    });
    
    return { components, wires, width: currentX - startX - gap, height: maxHeight };
  }
  
  if (node.type === 'parallel') {
    const children = node.children || [];
    const childResults: LayoutResult[] = [];
    let maxWidth = 0;
    let totalHeight = 0;
    
    // First pass: layout each child to get dimensions
    children.forEach(child => {
      const result = layoutNode(child, 0, 0, compSize, gap);
      childResults.push(result);
      maxWidth = Math.max(maxWidth, result.width);
      totalHeight += result.height + gap;
    });
    totalHeight -= gap;
    
    // Second pass: position children
    let currentY = startY - totalHeight / 2;
    const branchWidth = maxWidth + gap * 2;
    
    childResults.forEach((result, i) => {
      const offsetX = startX + (branchWidth - result.width) / 2;
      const offsetY = currentY + result.height / 2;
      
      // Offset all components
      result.components.forEach(comp => {
        comp.x += offsetX;
        comp.y += offsetY;
        components.push(comp);
      });
      
      result.wires.forEach(wire => {
        wire.points = wire.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
        wires.push(wire);
      });
      
      // Left connection wire
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: startX, y: startY },
          { x: startX, y: offsetY },
          { x: offsetX, y: offsetY }
        ]
      });
      
      // Right connection wire  
      wires.push({
        id: `wire_${idCounter++}`,
        points: [
          { x: offsetX + result.width, y: offsetY },
          { x: startX + branchWidth, y: offsetY },
          { x: startX + branchWidth, y: startY }
        ]
      });
      
      currentY += result.height + gap;
    });
    
    return { components, wires, width: branchWidth, height: totalHeight };
  }
  
  return { components, wires, width: 0, height: 0 };
}

export function parseCircuitNotation(input: string): { components: CircuitComponent[]; wires: Wire[] } {
  if (!input.trim()) return { components: [], wires: [] };
  
  try {
    idCounter = 0;
    const tokens = tokenize(input.trim());
    const pos = { index: 0 };
    const tree = parseExpression(tokens, pos);
    const result = layoutNode(tree, 100, 300);
    
    return { components: result.components, wires: result.wires };
  } catch (e) {
    console.error('Parse error:', e);
    return { components: [], wires: [] };
  }
}
