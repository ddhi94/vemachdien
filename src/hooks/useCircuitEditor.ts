import { useState, useCallback, useRef } from 'react';
import { CircuitComponent, Wire, ComponentType, SNAP_SIZE, Point } from '@/types/circuit';

let globalId = 1;
const genId = () => `comp_${globalId++}`;
const genWireId = () => `wire_${globalId++}`;

const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

// Pure function to get connection points for a component
function calcConnectionPoints(comp: CircuitComponent): Point[] {
  if (comp.type === 'junction' || comp.type === 'terminal_positive' || comp.type === 'terminal_negative') {
    return [{ x: comp.x, y: comp.y }];
  }
  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = 30;
  return [
    { x: comp.x + (-dx) * cos, y: comp.y + (-dx) * sin },
    { x: comp.x + dx * cos, y: comp.y + dx * sin },
  ];
}

export function useCircuitEditor() {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawingWire, setDrawingWire] = useState<Point[] | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<{ components: CircuitComponent[]; wires: Wire[] }[]>([]);
  const historyIndex = useRef(-1);

  const saveHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex.current + 1);
      newHistory.push({ components: [...components], wires: [...wires] });
      historyIndex.current = newHistory.length - 1;
      return newHistory;
    });
  }, [components, wires]);

  const addComponent = useCallback((type: ComponentType, x: number, y: number, label?: string) => {
    const comp: CircuitComponent = {
      id: genId(),
      type,
      x: snapToGrid(x),
      y: snapToGrid(y),
      rotation: 0,
      label: label || type,
    };
    setComponents(prev => [...prev, comp]);
    saveHistory();
    return comp;
  }, [saveHistory]);

  const moveComponent = useCallback((id: string, x: number, y: number) => {
    const sx = snapToGrid(x);
    const sy = snapToGrid(y);

    setComponents(prev => {
      const oldComp = prev.find(c => c.id === id);
      if (!oldComp) return prev;

      const dx = sx - oldComp.x;
      const dy = sy - oldComp.y;
      if (dx === 0 && dy === 0) return prev;

      // Get old connection points before move
      const oldPts = calcConnectionPoints(oldComp);

      // Update component position
      const newComps = prev.map(c => c.id === id ? { ...c, x: sx, y: sy } : c);

      // Get new connection points after move
      const newComp = { ...oldComp, x: sx, y: sy };
      const newPts = calcConnectionPoints(newComp);

      // Build mapping: old connection point -> new connection point
      const ptMap: { old: Point; new: Point }[] = [];
      for (let i = 0; i < oldPts.length; i++) {
        ptMap.push({ old: oldPts[i], new: newPts[i] });
      }

      // Update wires that are connected to these points
      setWires(prevWires => prevWires.map(wire => {
        let changed = false;
        const newPoints = wire.points.map(wp => {
          for (const pm of ptMap) {
            if (Math.abs(wp.x - pm.old.x) < 2 && Math.abs(wp.y - pm.old.y) < 2) {
              changed = true;
              return { x: pm.new.x, y: pm.new.y };
            }
          }
          return wp;
        });
        return changed ? { ...wire, points: newPoints } : wire;
      }));

      return newComps;
    });
  }, []);

  const rotateComponent = useCallback((id: string) => {
    setComponents(prev => prev.map(c =>
      c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c
    ));
  }, []);

  const deleteSelected = useCallback(() => {
    setComponents(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setWires(prev => prev.filter(w => !selectedIds.includes(w.id)));
    setSelectedIds([]);
    saveHistory();
  }, [selectedIds, saveHistory]);

  const selectComponent = useCallback((id: string, multi = false) => {
    if (multi) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const addWire = useCallback((points: Point[]) => {
    const wire: Wire = { id: genWireId(), points };
    setWires(prev => [...prev, wire]);
    saveHistory();
  }, [saveHistory]);

  const startDrawingWire = useCallback((point: Point) => {
    setDrawingWire([{ x: snapToGrid(point.x), y: snapToGrid(point.y) }]);
  }, []);

  const finishDrawingWire = useCallback((endPoint?: Point) => {
    if (drawingWire && drawingWire.length >= 1) {
      let finalPoints = [...drawingWire];
      if (endPoint) {
        const snapped = { x: snapToGrid(endPoint.x), y: snapToGrid(endPoint.y) };
        const last = finalPoints[finalPoints.length - 1];
        // Orthogonal routing
        if (last.x !== snapped.x && last.y !== snapped.y) {
          finalPoints.push({ x: snapped.x, y: last.y });
        }
        finalPoints.push(snapped);
      }
      if (finalPoints.length >= 2) {
        addWire(finalPoints);
      }
    }
    setDrawingWire(null);
  }, [drawingWire, addWire]);

  const cancelDrawingWire = useCallback(() => {
    setDrawingWire(null);
  }, []);

  // Add a junction point on an existing wire
  const addJunctionOnWire = useCallback((wireId: string, point: Point, label: string) => {
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };

    // Add junction component
    const junctionComp: CircuitComponent = {
      id: genId(),
      type: 'junction',
      x: snapped.x,
      y: snapped.y,
      rotation: 0,
      label,
    };
    setComponents(prev => [...prev, junctionComp]);

    // Split the wire at this point
    setWires(prev => {
      const wire = prev.find(w => w.id === wireId);
      if (!wire) return prev;

      // Find closest segment
      let bestSegIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < wire.points.length - 1; i++) {
        const a = wire.points[i];
        const b = wire.points[i + 1];
        const dist = pointToSegmentDist(snapped, a, b);
        if (dist < bestDist) {
          bestDist = dist;
          bestSegIdx = i;
        }
      }

      // Split into two wires
      const wire1Points = [...wire.points.slice(0, bestSegIdx + 1), snapped];
      const wire2Points = [snapped, ...wire.points.slice(bestSegIdx + 1)];

      const newWires = prev.filter(w => w.id !== wireId);
      if (wire1Points.length >= 2) newWires.push({ id: genWireId(), points: wire1Points });
      if (wire2Points.length >= 2) newWires.push({ id: genWireId(), points: wire2Points });
      return newWires;
    });

    saveHistory();
    return junctionComp;
  }, [saveHistory]);

  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const state = history[historyIndex.current];
      setComponents(state.components);
      setWires(state.wires);
    }
  }, [history]);

  const clearAll = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelectedIds([]);
    setDrawingWire(null);
    saveHistory();
  }, [saveHistory]);

  const loadParsedCircuit = useCallback((comps: CircuitComponent[], ws: Wire[]) => {
    setComponents(comps);
    setWires(ws);
    setSelectedIds([]);
    saveHistory();
  }, [saveHistory]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  }, []);

  // Get connection points for a component (in world coordinates)
  const getConnectionPoints = useCallback((comp: CircuitComponent): Point[] => {
    return calcConnectionPoints(comp);
  }, []);

  // Find nearest connection point within threshold
  const findNearestConnectionPoint = useCallback((point: Point, threshold: number = 15): { compId: string; point: Point } | null => {
    let best: { compId: string; point: Point; dist: number } | null = null;
    for (const comp of components) {
      const pts = getConnectionPoints(comp);
      for (const cp of pts) {
        const dist = Math.hypot(cp.x - point.x, cp.y - point.y);
        if (dist < threshold && (!best || dist < best.dist)) {
          best = { compId: comp.id, point: cp, dist };
        }
      }
    }
    return best ? { compId: best.compId, point: best.point } : null;
  }, [components, getConnectionPoints]);

  return {
    components,
    wires,
    selectedIds,
    drawingWire,
    pan,
    zoom,
    setPan,
    addComponent,
    moveComponent,
    rotateComponent,
    deleteSelected,
    selectComponent,
    selectMany,
    clearSelection,
    startDrawingWire,
    finishDrawingWire,
    cancelDrawingWire,
    addWire,
    addJunctionOnWire,
    undo,
    clearAll,
    loadParsedCircuit,
    handleZoom,
    setZoom,
    getConnectionPoints,
    findNearestConnectionPoint,
  };
}

// Utility: distance from point to line segment
function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(p.x - px, p.y - py);
}
