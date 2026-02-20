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
  const dx = 40; // Must be multiple of SNAP_SIZE (20) so points land on grid
  return [
    { x: Math.round(comp.x + (-dx) * cos), y: Math.round(comp.y + (-dx) * sin) },
    { x: Math.round(comp.x + dx * cos), y: Math.round(comp.y + dx * sin) },
  ];
}

interface HistoryState {
  components: CircuitComponent[];
  wires: Wire[];
}

export function useCircuitEditor() {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawingWire, setDrawingWire] = useState<Point[] | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // History system using refs for reliable snapshots
  const historyStack = useRef<HistoryState[]>([]);
  const historyIndex = useRef(-1);
  const isUndoing = useRef(false);

  // Snapshot current state BEFORE a mutation
  const pushHistory = useCallback(() => {
    if (isUndoing.current) return;
    // Use functional reads to get current state
    let currentComps: CircuitComponent[] = [];
    let currentWires: Wire[] = [];
    setComponents(prev => { currentComps = prev; return prev; });
    setWires(prev => { currentWires = prev; return prev; });

    // Trim any future states if we undid something
    const stack = historyStack.current.slice(0, historyIndex.current + 1);
    stack.push({ components: [...currentComps], wires: [...currentWires] });
    // Limit history size
    if (stack.length > 50) stack.shift();
    historyStack.current = stack;
    historyIndex.current = stack.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    isUndoing.current = true;
    historyIndex.current--;
    const state = historyStack.current[historyIndex.current];
    setComponents([...state.components]);
    setWires([...state.wires]);
    setSelectedIds([]);
    // Use timeout to reset flag after state updates
    setTimeout(() => { isUndoing.current = false; }, 0);
  }, []);

  const addComponent = useCallback((type: ComponentType, x: number, y: number, label?: string) => {
    pushHistory();
    const comp: CircuitComponent = {
      id: genId(),
      type,
      x: snapToGrid(x),
      y: snapToGrid(y),
      rotation: 0,
      label: label || type,
    };
    setComponents(prev => [...prev, comp]);
    return comp;
  }, [pushHistory]);

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
      const newComp = { ...oldComp, x: sx, y: sy };
      const newPts = calcConnectionPoints(newComp);

      // Build mapping: old connection point -> new connection point
      const ptMap: { old: Point; new: Point }[] = [];
      for (let i = 0; i < oldPts.length; i++) {
        ptMap.push({ old: oldPts[i], new: newPts[i] });
      }

      // Update wires that are connected to these points — use threshold 5 for reliability
      setWires(prevWires => prevWires.map(wire => {
        let changed = false;
        const newPoints = wire.points.map(wp => {
          for (const pm of ptMap) {
            if (Math.abs(wp.x - pm.old.x) < 5 && Math.abs(wp.y - pm.old.y) < 5) {
              changed = true;
              return { x: pm.new.x, y: pm.new.y };
            }
          }
          return wp;
        });
        return changed ? { ...wire, points: newPoints } : wire;
      }));

      return prev.map(c => c.id === id ? newComp : c);
    });
  }, []);

  // Move multiple selected components + their connected wires as a group
  const moveSelected = useCallback((ids: string[], dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return;

    setComponents(prev => {
      // Collect all old connection points for selected components
      const allOldPts: { old: Point; new: Point }[] = [];
      const selectedComps = prev.filter(c => ids.includes(c.id));

      selectedComps.forEach(comp => {
        const oldPts = calcConnectionPoints(comp);
        const newComp = { ...comp, x: comp.x + dx, y: comp.y + dy };
        const newPts = calcConnectionPoints(newComp);
        for (let i = 0; i < oldPts.length; i++) {
          allOldPts.push({ old: oldPts[i], new: newPts[i] });
        }
      });

      // Move wires connected to selected components
      setWires(prevWires => {
        // Also move wires that are fully selected
        const selectedWireIds = new Set(ids.filter(id => prevWires.some(w => w.id === id)));

        return prevWires.map(wire => {
          // If wire itself is selected, move all its points
          if (selectedWireIds.has(wire.id)) {
            return {
              ...wire,
              points: wire.points.map(wp => ({ x: wp.x + dx, y: wp.y + dy })),
            };
          }

          // Otherwise, move only points connected to selected components
          let changed = false;
          const newPoints = wire.points.map(wp => {
            for (const pm of allOldPts) {
              if (Math.abs(wp.x - pm.old.x) < 5 && Math.abs(wp.y - pm.old.y) < 5) {
                changed = true;
                return { x: pm.new.x, y: pm.new.y };
              }
            }
            return wp;
          });
          return changed ? { ...wire, points: newPoints } : wire;
        });
      });

      // Move selected components
      return prev.map(c => ids.includes(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c);
    });
  }, []);

  const rotateComponent = useCallback((id: string) => {
    pushHistory();
    setComponents(prev => {
      const comp = prev.find(c => c.id === id);
      if (!comp) return prev;

      const oldPts = calcConnectionPoints(comp);
      const newComp = { ...comp, rotation: (comp.rotation + 90) % 360 };
      const newPts = calcConnectionPoints(newComp);

      // Update connected wires
      const ptMap = oldPts.map((old, i) => ({ old, new: newPts[i] }));
      setWires(prevWires => prevWires.map(wire => {
        let changed = false;
        const newPoints = wire.points.map(wp => {
          for (const pm of ptMap) {
            if (Math.abs(wp.x - pm.old.x) < 5 && Math.abs(wp.y - pm.old.y) < 5) {
              changed = true;
              return { x: pm.new.x, y: pm.new.y };
            }
          }
          return wp;
        });
        return changed ? { ...wire, points: newPoints } : wire;
      }));

      return prev.map(c => c.id === id ? newComp : c);
    });
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    pushHistory();
    setComponents(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setWires(prev => prev.filter(w => !selectedIds.includes(w.id)));
    setSelectedIds([]);
  }, [selectedIds, pushHistory]);

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
    pushHistory();
    const wire: Wire = { id: genWireId(), points };
    setWires(prev => [...prev, wire]);
  }, [pushHistory]);

  const startDrawingWire = useCallback((point: Point) => {
    setDrawingWire([{ x: snapToGrid(point.x), y: snapToGrid(point.y) }]);
  }, []);

  const finishDrawingWire = useCallback((endPoint?: Point) => {
    if (drawingWire && drawingWire.length >= 1) {
      let finalPoints = [...drawingWire];
      if (endPoint) {
        // Use exact endpoint from caller — do NOT re-snap, it's already precise
        const last = finalPoints[finalPoints.length - 1];
        // Orthogonal routing
        if (last.x !== endPoint.x && last.y !== endPoint.y) {
          finalPoints.push({ x: endPoint.x, y: last.y });
        }
        finalPoints.push({ x: endPoint.x, y: endPoint.y });
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
    pushHistory();
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };

    const junctionComp: CircuitComponent = {
      id: genId(),
      type: 'junction',
      x: snapped.x,
      y: snapped.y,
      rotation: 0,
      label,
    };
    setComponents(prev => [...prev, junctionComp]);

    setWires(prev => {
      const wire = prev.find(w => w.id === wireId);
      if (!wire) return prev;

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

      const wire1Points = [...wire.points.slice(0, bestSegIdx + 1), snapped];
      const wire2Points = [snapped, ...wire.points.slice(bestSegIdx + 1)];

      const newWires = prev.filter(w => w.id !== wireId);
      if (wire1Points.length >= 2) newWires.push({ id: genWireId(), points: wire1Points });
      if (wire2Points.length >= 2) newWires.push({ id: genWireId(), points: wire2Points });
      return newWires;
    });

    return junctionComp;
  }, [pushHistory]);

  // Move a single point of a wire
  const moveWirePoint = useCallback((wireId: string, pointIndex: number, x: number, y: number) => {
    const sx = snapToGrid(x);
    const sy = snapToGrid(y);
    setWires(prev => prev.map(w => {
      if (w.id !== wireId) return w;
      const newPoints = [...w.points];
      newPoints[pointIndex] = { x: sx, y: sy };
      return { ...w, points: newPoints };
    }));
  }, []);

  // Insert a new bend point on a wire segment
  const insertWirePoint = useCallback((wireId: string, segmentIndex: number, point: Point) => {
    pushHistory();
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
    setWires(prev => prev.map(w => {
      if (w.id !== wireId) return w;
      const newPoints = [...w.points];
      newPoints.splice(segmentIndex + 1, 0, snapped);
      return { ...w, points: newPoints };
    }));
  }, [pushHistory]);

  // Delete a wire point (if wire has more than 2 points)
  const deleteWirePoint = useCallback((wireId: string, pointIndex: number) => {
    pushHistory();
    setWires(prev => prev.map(w => {
      if (w.id !== wireId) return w;
      if (w.points.length <= 2) return w;
      const newPoints = w.points.filter((_, i) => i !== pointIndex);
      return { ...w, points: newPoints };
    }));
  }, [pushHistory]);

  const toggleSwitch = useCallback((id: string) => {
    pushHistory();
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.type === 'switch_open') return { ...c, type: 'switch_closed' as ComponentType };
      if (c.type === 'switch_closed') return { ...c, type: 'switch_open' as ComponentType };
      return c;
    }));
  }, [pushHistory]);

  const clearAll = useCallback(() => {
    pushHistory();
    setComponents([]);
    setWires([]);
    setSelectedIds([]);
    setDrawingWire(null);
  }, [pushHistory]);

  const loadParsedCircuit = useCallback((comps: CircuitComponent[], ws: Wire[]) => {
    pushHistory();
    setComponents(comps);
    setWires(ws);
    setSelectedIds([]);
  }, [pushHistory]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
  }, []);

  const getConnectionPoints = useCallback((comp: CircuitComponent): Point[] => {
    return calcConnectionPoints(comp);
  }, []);

  const findNearestConnectionPoint = useCallback((point: Point, threshold: number = 30): { compId: string; point: Point } | null => {
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
    for (const wire of wires) {
      for (const wp of [wire.points[0], wire.points[wire.points.length - 1]]) {
        const dist = Math.hypot(wp.x - point.x, wp.y - point.y);
        if (dist < threshold && (!best || dist < best.dist)) {
          best = { compId: wire.id, point: wp, dist };
        }
      }
    }
    return best ? { compId: best.compId, point: best.point } : null;
  }, [components, wires, getConnectionPoints]);

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
    moveSelected,
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
    moveWirePoint,
    insertWirePoint,
    deleteWirePoint,
    toggleSwitch,
    undo,
    clearAll,
    loadParsedCircuit,
    handleZoom,
    setZoom,
    getConnectionPoints,
    findNearestConnectionPoint,
    pushHistory,
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
