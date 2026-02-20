import { useState, useCallback, useRef } from 'react';
import { CircuitComponent, Wire, ComponentType, SNAP_SIZE, Point } from '@/types/circuit';

let globalId = 1;
const genId = () => `comp_${globalId++}`;
const genWireId = () => `wire_${globalId++}`;

const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

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
    setComponents(prev => prev.map(c => 
      c.id === id ? { ...c, x: snapToGrid(x), y: snapToGrid(y) } : c
    ));
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

  const continueDrawingWire = useCallback((point: Point) => {
    if (!drawingWire) return;
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
    const last = drawingWire[drawingWire.length - 1];
    // Orthogonal routing
    if (last.x !== snapped.x && last.y !== snapped.y) {
      setDrawingWire(prev => prev ? [...prev, { x: snapped.x, y: last.y }, snapped] : null);
    } else {
      setDrawingWire(prev => prev ? [...prev, snapped] : null);
    }
  }, [drawingWire]);

  const finishDrawingWire = useCallback(() => {
    if (drawingWire && drawingWire.length >= 2) {
      addWire(drawingWire);
    }
    setDrawingWire(null);
  }, [drawingWire, addWire]);

  const cancelDrawingWire = useCallback(() => {
    setDrawingWire(null);
  }, []);

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
    continueDrawingWire,
    finishDrawingWire,
    cancelDrawingWire,
    addWire,
    undo,
    clearAll,
    loadParsedCircuit,
    handleZoom,
    setZoom,
  };
}
