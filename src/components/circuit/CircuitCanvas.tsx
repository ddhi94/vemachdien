import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { CircuitComponent, Wire, Point, ComponentType, SNAP_SIZE } from '@/types/circuit';
import { renderSymbolOnCanvas } from './CircuitSymbolSVG';

interface Props {
  components: CircuitComponent[];
  wires: Wire[];
  selectedIds: string[];
  drawingWire: Point[] | null;
  pan: { x: number; y: number };
  zoom: number;
  setPan: (p: { x: number; y: number }) => void;
  onDrop: (type: ComponentType, x: number, y: number, label?: string) => void;
  onSelectComponent: (id: string, multi: boolean) => void;
  onSelectMany: (ids: string[]) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onMoveComponentNode: (id: string, oldPoint: Point, newPoint: Point) => void;
  onMoveSelected: (ids: string[], dx: number, dy: number) => void;
  onRotateComponent: (id: string) => void;
  onToggleSwitch: (id: string) => void;
  onClearSelection: () => void;
  onStartWire: (p: Point) => void;
  onFinishWire: (endPoint?: Point) => void;
  onCancelWire: () => void;
  onZoom: (delta: number) => void;
  onAddJunctionOnWire: (wireId: string, point: Point, label: string) => void;
  onMoveWirePoint: (wireId: string, pointIndex: number, x: number, y: number) => void;
  onInsertWirePoint: (wireId: string, segmentIndex: number, point: Point) => void;
  onDeleteWirePoint: (wireId: string, pointIndex: number) => void;
  getConnectionPoints: (comp: CircuitComponent) => Point[];
  findNearestConnectionPoint: (point: Point, threshold?: number) => { compId: string; point: Point } | null;
  pushHistory: () => void;
  setComponentLabel: (id: string, label: string) => void;
  updateComponentValue: (id: string, value: string) => void;
  moveLabel: (id: string, x: number, y: number) => void;
  globalStrokeWidth: number;
  mode: 'select' | 'wire';
  hideNodes: boolean;
  showLabels: boolean;
}

const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

interface MarqueeRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const CircuitCanvas: React.FC<Props> = ({
  components,
  wires,
  selectedIds,
  drawingWire,
  pan,
  zoom,
  setPan,
  onDrop,
  onSelectComponent,
  onSelectMany,
  onMoveComponent,
  onMoveComponentNode,
  onMoveSelected,
  onRotateComponent,
  onToggleSwitch,
  onClearSelection,
  onStartWire,
  onFinishWire,
  onCancelWire,
  onZoom,
  onAddJunctionOnWire,
  onMoveWirePoint,
  onInsertWirePoint,
  onDeleteWirePoint,
  getConnectionPoints,
  findNearestConnectionPoint,
  pushHistory,
  setComponentLabel,
  updateComponentValue,
  moveLabel,
  globalStrokeWidth,
  mode,
  hideNodes,
  showLabels,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; startX: number; startY: number; isGroup: boolean } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; type: 'scale' | 'length' | 'angle'; startX: number; startY: number; initialValue: string; handle: string } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [rawMousePos, setRawMousePos] = useState<Point>({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ compId: string; point: Point } | null>(null);
  const [wireDrawing, setWireDrawing] = useState(false);
  const [wireClickedOnWire, setWireClickedOnWire] = useState<{ wireId: string; point: Point } | null>(null);
  const [junctionLabelInput, setJunctionLabelInput] = useState<{ wireId: string; compId: string | null; point: Point; x: number; y: number } | null>(null);
  const [componentValueInput, setComponentValueInput] = useState<{ compId: string; initialValue: string; x: number; y: number } | null>(null);

  // Dragging state
  const [draggingWirePoint, setDraggingWirePoint] = useState<{ wireId: string; pointIndex: number } | null>(null);
  const [draggingCompNode, setDraggingCompNode] = useState<{ compId: string; oldPoint: Point } | null>(null);
  const [draggingLabel, setDraggingLabel] = useState<{ id: string; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null);

  // Alignment guide state
  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });

  const getSVGPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const getScreenPos = useCallback((svgPoint: Point): Point => {
    return {
      x: svgPoint.x * zoom + pan.x,
      y: svgPoint.y * zoom + pan.y,
    };
  }, [pan, zoom]);

  // All connection points for snapping
  const allConnectionPoints = useMemo(() => {
    const pts: { compId: string; point: Point }[] = [];
    components.forEach(comp => {
      const cps = getConnectionPoints(comp);
      cps.forEach(p => pts.push({ compId: comp.id, point: p }));
    });
    wires.forEach(wire => {
      pts.push({ compId: wire.id, point: wire.points[0] });
      pts.push({ compId: wire.id, point: wire.points[wire.points.length - 1] });
    });
    return pts;
  }, [components, wires, getConnectionPoints]);

  const snapToAlignment = useCallback((point: Point, excludeCompId?: string) => {
    let bestX = snapToGrid(point.x);
    let bestY = snapToGrid(point.y);
    let alignX: number | null = null;
    let alignY: number | null = null;
    const threshold = 10;

    for (const cp of allConnectionPoints) {
      if (excludeCompId && cp.compId === excludeCompId) continue;

      if (Math.abs(point.x - cp.point.x) < threshold) {
        bestX = cp.point.x;
        alignX = cp.point.x;
      }
      if (Math.abs(point.y - cp.point.y) < threshold) {
        bestY = cp.point.y;
        alignY = cp.point.y;
      }
    }

    return { point: { x: bestX, y: bestY }, guides: { x: alignX, y: alignY } };
  }, [allConnectionPoints]);

  // Find snap target near mouse
  const snapTarget = useMemo(() => {
    if (!wireDrawing && !drawingWire) return null;
    const threshold = 30;
    let best: { compId: string; point: Point; dist: number } | null = null;
    for (const cp of allConnectionPoints) {
      const dist = Math.hypot(cp.point.x - rawMousePos.x, cp.point.y - rawMousePos.y);
      if (dist < threshold && (!best || dist < best.dist)) {
        best = { ...cp, dist };
      }
    }
    return best ? { compId: best.compId, point: best.point } : null;
  }, [wireDrawing, drawingWire, allConnectionPoints, rawMousePos]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      onZoom(e.deltaY > 0 ? -0.1 : 0.1);
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  }, [pan, setPan, onZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (junctionLabelInput) {
      setJunctionLabelInput(null);
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
      return;
    }

    if (e.button === 0 && mode === 'wire') {
      const point = getSVGPoint(e.clientX, e.clientY);
      if (drawingWire) {
        if (snapTarget) {
          onFinishWire(snapTarget.point);
        } else {
          const snap = findNearestConnectionPoint(point, 30);
          if (snap) {
            onFinishWire(snap.point);
          } else {
            onCancelWire();
          }
        }
      } else {
        const snap = findNearestConnectionPoint(point, 30);
        if (snap) {
          onStartWire(snap.point);
        }
      }
      return;
    }

    if (e.button === 0 && mode === 'select') {
      const target = e.target as SVGElement;
      if (target === svgRef.current || target.classList.contains('canvas-bg')) {
        onClearSelection();
        const point = getSVGPoint(e.clientX, e.clientY);
        setMarquee({ startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
      }
    }
  }, [mode, pan, getSVGPoint, drawingWire, snapTarget, onStartWire, onFinishWire, onCancelWire, onClearSelection, findNearestConnectionPoint, junctionLabelInput]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getSVGPoint(e.clientX, e.clientY);
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
    setMousePos(snapped);
    setRawMousePos(point);

    if (resizing) {
      const params = resizing.initialValue.split(',').map(s => s.trim());
      // Ensure params[0] (label/length) and params[1] (scale) exist
      if (params.length < 1) params[0] = "";

      if (resizing.type === 'length') {
        const dx = point.x - resizing.startX;
        const dy = point.y - resizing.startY;

        if (resizing.id.includes('vector')) {
          // Vector uses val2 for length
          if (params.length < 2) params[1] = "";
          const initialLen = parseFloat(params[1]) || 40;
          const newLen = Math.max(20, initialLen + dx);
          params[1] = Math.round(newLen).toString();
        } else if (resizing.id.includes('trajectory')) {
          if (resizing.handle === 'height_traj') {
            if (params.length < 2) params[1] = "";
            const initialHeight = parseFloat(params[1]) || 60;
            // Negative dy means dragging UP (increasing height since Y points down)
            const newHeight = Math.max(10, initialHeight - dy);
            params[1] = Math.round(newHeight).toString();
          } else {
            const initialWidth = parseFloat(params[0]) || 120;
            const newWidth = Math.max(20, initialWidth + dx);
            params[0] = Math.round(newWidth).toString();
          }
        } else if (resizing.id.includes('pulley_fixed')) {
          if (params.length < 2) params[1] = params[0] || "25";
          const isLeft = resizing.handle === 'length_left';
          const initialLen = parseFloat(isLeft ? params[0] : params[1]) || 25;
          const newLen = Math.max(10, initialLen + dy);
          if (isLeft) {
            params[0] = Math.round(newLen).toString();
          } else {
            params[1] = Math.round(newLen).toString();
          }
        } else {
          // Spring, Pendulum, Axis use val1 for length
          const initialLen = parseFloat(params[0]) || (resizing.id.includes('pendulum') ? 50 : 60);
          const delta = resizing.handle === 'end' && resizing.id.includes('pendulum') ? dy : dx;
          const newLen = Math.max(20, initialLen + delta);
          params[0] = Math.round(newLen).toString();
        }
        updateComponentValue(resizing.id, params.join(', '));
      } else if (resizing.type === 'scale') {
        if (params.length < 2) params[1] = "1";
        const initialScale = parseFloat(params[1]) || 1;

        // Calculate scale based on distance from component center (comp.x, comp.y)
        // Note: resizing.startX/Y are in SVG coords. We need to find the component's center.
        const comp = components.find(c => c.id === resizing.id);
        if (comp) {
          const center = { x: comp.x, y: comp.y };
          const initialDist = Math.hypot(resizing.startX - center.x, resizing.startY - center.y);
          const currentDist = Math.hypot(point.x - center.x, point.y - center.y);

          if (initialDist > 5) { // Avoid division by zero or extreme sensitivity near center
            const ratio = currentDist / initialDist;
            const newScale = Math.max(0.2, Math.min(5, initialScale * ratio));
            params[1] = newScale.toFixed(2);
            updateComponentValue(resizing.id, params.join(', '));
          }
        }
      } else if (resizing.type === 'angle') {
        const initialAngle = parseFloat(params[0]) || (resizing.id.includes('cart') ? 0 : 30);
        const dy = point.y - resizing.startY;
        // Drag up (negative dy) increases angle. Drag down decreases.
        // For cart we allow -80 to 80. For inclined plane 10 to 80.
        const minAngle = resizing.id.includes('cart') ? -80 : 10;
        const newAngle = Math.max(minAngle, Math.min(80, initialAngle - dy));
        params[0] = Math.round(newAngle).toString();
        updateComponentValue(resizing.id, params.join(', '));
      }
      return;
    }

    if (mode === 'select' && !dragging && !marquee && !draggingWirePoint) {
      const near = findNearestConnectionPoint(point, 15);
      setHoveredNode(near);
    }

    if (panning) {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      });
      return;
    }

    if (marquee) {
      setMarquee(prev => prev ? { ...prev, currentX: point.x, currentY: point.y } : null);
      return;
    }

    if (wireDrawing && drawingWire) {
      return;
    }

    // Dragging a wire bend point
    if (draggingWirePoint) {
      onMoveWirePoint(draggingWirePoint.wireId, draggingWirePoint.pointIndex, point.x, point.y);
      return;
    }

    if (draggingLabel) {
      const sx = snapToGrid(point.x - draggingLabel.offsetX);
      const sy = snapToGrid(point.y - draggingLabel.offsetY);
      const dx = sx - draggingLabel.startX;
      const dy = sy - draggingLabel.startY;
      if (dx !== 0 || dy !== 0) {
        moveLabel(draggingLabel.id, dx, dy);
        setDraggingLabel(prev => prev ? { ...prev, startX: sx, startY: sy } : null);
      }
      return;
    }

    if (draggingCompNode) {
      const { point: snappedPoint, guides } = snapToAlignment(point, draggingCompNode.compId);
      setAlignmentGuides(guides);
      if (snappedPoint.x !== draggingCompNode.oldPoint.x || snappedPoint.y !== draggingCompNode.oldPoint.y) {
        onMoveComponentNode(draggingCompNode.compId, draggingCompNode.oldPoint, snappedPoint);
        setDraggingCompNode({ compId: draggingCompNode.compId, oldPoint: snappedPoint });
      }
      return;
    }

    if (dragging) {
      const rawX = point.x - dragging.offsetX;
      const rawY = point.y - dragging.offsetY;

      if (dragging.isGroup) {
        const sx = snapToGrid(rawX);
        const sy = snapToGrid(rawY);
        const dx = sx - dragging.startX;
        const dy = sy - dragging.startY;
        if (dx !== 0 || dy !== 0) {
          onMoveSelected(selectedIds, dx, dy);
          setDragging(prev => prev ? { ...prev, startX: sx, startY: sy } : null);
        }
        setAlignmentGuides({ x: null, y: null });
      } else {
        const { point: snapped, guides } = snapToAlignment({ x: rawX, y: rawY }, dragging.id);
        setAlignmentGuides(guides);
        onMoveComponent(dragging.id, snapped.x, snapped.y);
      }
    }
  }, [getSVGPoint, panning, dragging, marquee, wireDrawing, drawingWire, draggingWirePoint, draggingCompNode, draggingLabel, mode, setPan, onMoveComponent, onMoveComponentNode, onMoveSelected, onMoveWirePoint, moveLabel, selectedIds, findNearestConnectionPoint, snapToAlignment, resizing, updateComponentValue]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setAlignmentGuides({ x: null, y: null });

    if (dragging || draggingCompNode || draggingWirePoint || draggingLabel || marquee || resizing) {
      pushHistory();
    }

    if (panning) setPanning(null);

    setDragging(null);
    setResizing(null);
    setMarquee(null);

    if (wireDrawing && drawingWire) {
      if (snapTarget) {
        onFinishWire(snapTarget.point);
      } else {
        const point = getSVGPoint(e.clientX, e.clientY);
        const snap = findNearestConnectionPoint(point, 30);
        if (snap) {
          onFinishWire(snap.point);
        } else {
          onCancelWire();
        }
      }
      setWireDrawing(false);
      return;
    }

    if (draggingWirePoint) {
      setDraggingWirePoint(null);
      return;
    }

    if (draggingCompNode) {
      setDraggingCompNode(null);
      return;
    }

    if (draggingLabel) setDraggingLabel(null);

    if (dragging) setDragging(null);

    if (marquee) {
      const x1 = Math.min(marquee.startX, marquee.currentX);
      const y1 = Math.min(marquee.startY, marquee.currentY);
      const x2 = Math.max(marquee.startX, marquee.currentX);
      const y2 = Math.max(marquee.startY, marquee.currentY);

      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const hitIds: string[] = [];
        components.forEach(comp => {
          if (comp.x + 40 >= x1 && comp.x - 40 <= x2 && comp.y + 22 >= y1 && comp.y - 22 <= y2) {
            hitIds.push(comp.id);
          }
        });
        wires.forEach(wire => {
          if (wire.points.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2)) {
            hitIds.push(wire.id);
          }
        });
        if (hitIds.length > 0) onSelectMany(hitIds);
      }
      setMarquee(null);
    }
  }, [panning, dragging, marquee, wireDrawing, drawingWire, draggingWirePoint, snapTarget, components, wires, getSVGPoint, findNearestConnectionPoint, onFinishWire, onCancelWire, onSelectMany]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (mode === 'wire' && drawingWire) {
      const point = getSVGPoint(e.clientX, e.clientY);
      onFinishWire(point);
    }
  }, [mode, drawingWire, getSVGPoint, onFinishWire]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    const label = e.dataTransfer.getData('componentLabel');
    if (type) {
      const point = getSVGPoint(e.clientX, e.clientY);
      onDrop(type, point.x, point.y, label || undefined);
    }
  }, [getSVGPoint, onDrop]);

  // Start wire from connection point or drag it if in select mode
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, compPoint: Point) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button === 0) { // Left click
      if (mode === 'wire' || e.altKey) {
        onStartWire(compPoint);
        setWireDrawing(true);
        setNodeContextMenu(null);
      }
    }
  }, [mode, onStartWire]);

  // Context menu on right click for junction points
  const [nodeContextMenu, setNodeContextMenu] = useState<{ point: Point; compId: string | null; wireId: string | null; pointIndex: number | null; x: number; y: number } | null>(null);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, point: Point, compId: string | null = null, wireId: string | null = null, pointIndex: number | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setNodeContextMenu({
      point,
      compId,
      wireId,
      pointIndex,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handleComponentMouseDown = useCallback((e: React.MouseEvent, comp: CircuitComponent) => {
    if (mode === 'select') {
      e.stopPropagation();
      const point = getSVGPoint(e.clientX, e.clientY);
      const isMulti = e.ctrlKey || e.metaKey;
      onSelectComponent(comp.id, isMulti);

      const isSelected = selectedIds.includes(comp.id);
      if (isSelected || isMulti) {
        setDragging({
          id: comp.id,
          offsetX: point.x - comp.x,
          offsetY: point.y - comp.y,
          startX: comp.x,
          startY: comp.y,
          isGroup: selectedIds.length > 1 || isMulti
        });
      }
    }
  }, [mode, getSVGPoint, onSelectComponent, selectedIds]);

  const handleResizeHandleMouseDown = useCallback((e: React.MouseEvent, comp: CircuitComponent, type: 'scale' | 'length' | 'angle', handleId: string) => {
    e.stopPropagation();
    const point = getSVGPoint(e.clientX, e.clientY);
    pushHistory(); // Add pushHistory here
    setResizing({
      id: comp.id,
      type,
      startX: point.x,
      startY: point.y,
      initialValue: comp.value || '',
      handle: handleId
    });
  }, [getSVGPoint, pushHistory]);

  const handleLabelMouseDown = useCallback((e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (mode === 'select') {
      const point = getSVGPoint(e.clientX, e.clientY);
      pushHistory();

      const currentOffset = comp.labelOffset || { x: 0, y: 0 };
      const isPointLike = comp.type === 'junction' || comp.type === 'terminal_positive' || comp.type === 'terminal_negative';
      const defaultY = isPointLike ? -12 : (comp.rotation === 90 || comp.rotation === 270 ? 25 : -20);
      const currentLabelX = comp.x + currentOffset.x;
      const currentLabelY = comp.y + defaultY + currentOffset.y;

      setDraggingLabel({
        id: comp.id,
        offsetX: point.x - currentLabelX,
        offsetY: point.y - currentLabelY,
        startX: currentLabelX,
        startY: currentLabelY,
      });
    }
  }, [mode, getSVGPoint, pushHistory]);

  const handleComponentDblClick = useCallback((e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (comp.type === 'switch_open' || comp.type === 'switch_closed') {
      onToggleSwitch(comp.id);
    } else {
      onRotateComponent(comp.id);
    }
  }, [onRotateComponent, onToggleSwitch]);

  // Click on wire to select it
  const handleWireClick = useCallback((e: React.MouseEvent, wireId: string) => {
    e.stopPropagation();
    if (mode === 'select') {
      if (e.shiftKey) {
        onSelectComponent(wireId, true);
        return;
      }
      onSelectComponent(wireId, false);
      // Show + button on wire
      const point = getSVGPoint(e.clientX, e.clientY);
      const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
      setWireClickedOnWire({ wireId, point: snapped });
    } else {
      onSelectComponent(wireId, e.shiftKey);
    }
  }, [mode, getSVGPoint, onSelectComponent]);

  // Start dragging a wire bend point
  const handleWirePointMouseDown = useCallback((e: React.MouseEvent, wireId: string, pointIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    pushHistory();
    setDraggingWirePoint({ wireId, pointIndex });
  }, [pushHistory]);

  // Double-click on wire segment to add a new bend point
  const handleWireSegmentDblClick = useCallback((e: React.MouseEvent, wireId: string, segmentIndex: number) => {
    e.stopPropagation();
    const point = getSVGPoint(e.clientX, e.clientY);
    onInsertWirePoint(wireId, segmentIndex, point);
  }, [getSVGPoint, onInsertWirePoint]);

  // Handle clicking the + button on a wire
  const handleAddJunctionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wireClickedOnWire) return;
    const screenPos = getScreenPos(wireClickedOnWire.point);
    setJunctionLabelInput({
      wireId: wireClickedOnWire.wireId,
      compId: null,
      point: wireClickedOnWire.point,
      x: screenPos.x,
      y: screenPos.y,
    });
    setWireClickedOnWire(null);
  }, [wireClickedOnWire, getScreenPos]);

  const handleJunctionLabelSubmit = useCallback((label: string) => {
    if (junctionLabelInput && label.trim()) {
      if (junctionLabelInput.compId) {
        // Renaming an existing junction
        setComponentLabel(junctionLabelInput.compId, label.trim().toUpperCase());
      } else {
        // Adding a new junction on a wire
        onAddJunctionOnWire(junctionLabelInput.wireId, junctionLabelInput.point, label.trim().toUpperCase());
      }
    }
    setJunctionLabelInput(null);
  }, [junctionLabelInput, onAddJunctionOnWire, setComponentLabel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        onCancelWire();
        onClearSelection();
        setWireClickedOnWire(null);
        setJunctionLabelInput(null);
        setComponentValueInput(null);
        setNodeContextMenu(null);
        setWireDrawing(false);
        setDraggingWirePoint(null);
        setDraggingCompNode(null);
        setDraggingLabel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancelWire, onClearSelection]);

  // Handle clicking outside context menus
  useEffect(() => {
    const handleClickOutside = () => setNodeContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Clear wire click when selecting a non-wire component
  useEffect(() => {
    if (selectedIds.length > 0) {
      const hasSelectedWire = wires.some(w => selectedIds.includes(w.id));
      if (!hasSelectedWire) setWireClickedOnWire(null);
    }
  }, [selectedIds, wires]);

  const marqueeRect = marquee ? {
    x: Math.min(marquee.startX, marquee.currentX),
    y: Math.min(marquee.startY, marquee.currentY),
    width: Math.abs(marquee.currentX - marquee.startX),
    height: Math.abs(marquee.currentY - marquee.startY),
  } : null;

  const wirePreviewEnd = useMemo(() => {
    if (!drawingWire || drawingWire.length === 0) return mousePos;
    let end = mousePos;

    // Orthogonal snap logic when drawing
    const lastPoint = drawingWire[drawingWire.length - 1];
    if (lastPoint && !snapTarget) {
      const dx = Math.abs(end.x - lastPoint.x);
      const dy = Math.abs(end.y - lastPoint.y);
      // If slope is near horizontal
      if (dy < 25 && dx > 25) {
        end = { x: end.x, y: lastPoint.y };
      }
      // If slope is near vertical
      else if (dx < 25 && dy > 25) {
        end = { x: lastPoint.x, y: lastPoint.y };
      }
    }

    if (snapTarget) return snapTarget.point;
    return end;
  }, [drawingWire, mousePos, snapTarget]);

  const wirePreviewPoints = useMemo(() => {
    if (!drawingWire || drawingWire.length === 0) return [];
    const pts = [...drawingWire];
    const last = pts[pts.length - 1];
    const end = wirePreviewEnd;
    if (last.x !== end.x && last.y !== end.y) {
      pts.push({ x: end.x, y: last.y });
    }
    pts.push(end);
    return pts;
  }, [drawingWire, wirePreviewEnd]);

  return (
    <>
      <svg
        ref={svgRef}
        className="w-full h-full circuit-grid"
        style={{
          cursor: mode === 'wire' ? 'crosshair'
            : (panning ? 'grabbing'
              : (marquee ? 'crosshair'
                : (draggingWirePoint ? 'grabbing'
                  : (hoveredNode ? 'crosshair' : 'default')))),
          background: 'hsl(var(--canvas-bg))',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <rect className="canvas-bg" x="-10000" y="-10000" width="20000" height="20000" fill="transparent" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Wires */}
          {wires.map(wire => {
            const isSelected = selectedIds.includes(wire.id);
            return (
              <g key={wire.id}>
                {/* Invisible thick line for easier clicking */}
                <polyline
                  points={wire.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleWireClick(e, wire.id)}
                />
                {/* Per-segment invisible lines for double-click to add bend point */}
                {wire.points.length >= 2 && wire.points.slice(0, -1).map((p, i) => {
                  const next = wire.points[i + 1];
                  return (
                    <line
                      key={`seg_${i}`}
                      x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                      stroke="transparent"
                      strokeWidth={14}
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={(e) => handleWireSegmentDblClick(e, wire.id, i)}
                    />
                  );
                })}
                <polyline
                  points={wire.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={isSelected ? 'hsl(var(--component-selected))' : 'hsl(var(--wire-color))'}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Wire bend point handles - show when wire is selected */}
                {isSelected && wire.points.map((p, i) => (
                  <g key={`wp_${i}`}>
                    {/* Draggable handle */}
                    <rect
                      x={p.x - 5} y={p.y - 5} width={10} height={10}
                      fill="hsl(var(--component-selected))"
                      stroke="white"
                      strokeWidth={1}
                      rx={2}
                      style={{ cursor: 'move' }}
                      onMouseDown={(e) => handleWirePointMouseDown(e, wire.id, i)}
                    />
                  </g>
                ))}
                {/* Endpoint dots when not selected */}
                {!isSelected && wire.points.map((p, i) => {
                  if (i !== 0 && i !== wire.points.length - 1) return null;
                  if (hideNodes && !drawingWire && !wireDrawing) return null;
                  const isEndpointHovered = hoveredNode === null &&
                    Math.hypot(rawMousePos.x - p.x, rawMousePos.y - p.y) < 15;
                  return (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={3} fill="hsl(var(--node-color))" />
                      <circle
                        cx={p.x} cy={p.y} r={isEndpointHovered ? 8 : 6}
                        fill="transparent"
                        style={{ cursor: 'crosshair' }}
                        onMouseDown={(e) => {
                          if (e.button === 0) {
                            if (mode === 'wire' || e.altKey) {
                              onStartWire({ x: p.x, y: p.y });
                              setWireDrawing(true);
                            } else if (mode === 'select') {
                              handleWirePointMouseDown(e, wire.id, i); // Handle dragging of wire endpoint directly
                            }
                          }
                        }}
                        onContextMenu={(e) => handleNodeContextMenu(e, { x: p.x, y: p.y }, null, wire.id, i)}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Alignment Guides */}
          {alignmentGuides.x !== null && (
            <line
              x1={alignmentGuides.x} y1={-10000}
              x2={alignmentGuides.x} y2={10000}
              stroke="hsl(213, 70%, 45%)"
              strokeWidth={1}
              strokeDasharray="5 5"
              opacity={0.6}
              style={{ pointerEvents: 'none' }}
            />
          )}
          {alignmentGuides.y !== null && (
            <line
              x1={-10000} y1={alignmentGuides.y}
              x2={10000} y2={alignmentGuides.y}
              stroke="hsl(213, 70%, 45%)"
              strokeWidth={1}
              strokeDasharray="5 5"
              opacity={0.6}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* + button on clicked wire */}
          {wireClickedOnWire && (
            <g
              transform={`translate(${wireClickedOnWire.point.x}, ${wireClickedOnWire.point.y})`}
              style={{ cursor: 'pointer' }}
              onClick={handleAddJunctionClick}
            >
              <circle r={12} fill="hsl(var(--component-selected))" opacity={0.9} />
              <text x={0} y={5} fontSize={16} fontWeight="bold" fill="white" textAnchor="middle" style={{ pointerEvents: 'none' }}>+</text>
            </g>
          )}

          {/* Drawing wire preview */}
          {drawingWire && wirePreviewPoints.length >= 2 && (
            <>
              <polyline
                points={wirePreviewPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="hsl(var(--component-selected))"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.7}
                style={{ pointerEvents: 'none' }}
              />
              {snapTarget && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={snapTarget.point.x} cy={snapTarget.point.y} r={12} fill="hsl(145, 60%, 45%)" opacity={0.2} />
                  <circle cx={snapTarget.point.x} cy={snapTarget.point.y} r={8} fill="none" stroke="hsl(145, 60%, 40%)" strokeWidth={2.5} />
                  <circle cx={snapTarget.point.x} cy={snapTarget.point.y} r={3} fill="hsl(145, 60%, 40%)" />
                </g>
              )}
            </>
          )}

          {/* Components */}
          {components.map(comp => {
            const isSelected = selectedIds.includes(comp.id);
            const isJunction = comp.type === 'junction';
            const isTerminal = comp.type === 'terminal_positive' || comp.type === 'terminal_negative';
            const isPointLike = isJunction || isTerminal;
            const connPts = getConnectionPoints(comp);

            return (
              <g key={comp.id}>
                <g
                  transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                  style={{ cursor: mode === 'select' ? 'move' : 'default' }}
                  onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                  onContextMenu={(e) => {
                    if (comp.type === 'mech_inclined_plane') {
                      handleNodeContextMenu(e, { x: comp.x, y: comp.y }, comp.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const screenPos = getScreenPos({ x: comp.x, y: comp.y });
                    if (['mech_inclined_plane', 'mech_cart', 'mech_spring', 'mech_pendulum', 'mech_vector', 'mech_axis', 'mech_trajectory'].includes(comp.type)) {
                      setComponentValueInput({
                        compId: comp.id,
                        initialValue: comp.value || '',
                        x: screenPos.x,
                        y: screenPos.y,
                      });
                    } else {
                      handleComponentDblClick(e, comp); // Fallback for junction logic
                    }
                  }}
                >
                  {/* Invisible hit area */}
                  {isPointLike ? (
                    <circle cx={0} cy={0} r={15} fill="transparent" />
                  ) : (
                    <rect x={-45} y={-22} width={90} height={44} fill="transparent" />
                  )}

                  {/* Selection highlight */}
                  {isSelected && !isPointLike && (
                    <rect x={-45} y={-22} width={90} height={44} fill="none" stroke="hsl(var(--component-selected))" strokeWidth={1.5} strokeDasharray="4 2" rx={4} />
                  )}
                  {isSelected && isPointLike && (
                    <circle cx={0} cy={0} r={12} fill="none" stroke="hsl(var(--component-selected))" strokeWidth={1.5} strokeDasharray="4 2" />
                  )}

                  {/* Lead extensions from symbol (±30) to connection points (±40) - hide for mechanic */}
                  {!isPointLike && !comp.type.startsWith('mech_') && (
                    <>
                      <line x1={-30} y1={0} x2={-40} y2={0} stroke={isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 30%, 20%)'} strokeWidth={2} />
                      <line x1={30} y1={0} x2={40} y2={0} stroke={isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 30%, 20%)'} strokeWidth={2} />
                    </>
                  )}

                  {/* Symbol */}
                  {renderSymbolOnCanvas(
                    comp.type,
                    isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 30%, 20%)',
                    globalStrokeWidth, 60, comp.value
                  )}

                  {/* Label - show for junctions always, for other components only when showLabels is on */}
                  {!isTerminal && (isPointLike || showLabels) && (
                    <text
                      x={comp.labelOffset?.x || 0}
                      y={(isPointLike ? -12 : (comp.rotation === 90 || comp.rotation === 270 ? 25 : -20)) + (comp.labelOffset?.y || 0)}
                      fontSize={isPointLike ? 13 : 11}
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight={isPointLike ? 700 : 500}
                      fill={isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 25%, 35%)'}
                      textAnchor="middle"
                      style={{ pointerEvents: 'auto', userSelect: 'none', cursor: 'move' }}
                      onMouseDown={(e) => handleLabelMouseDown(e, comp)}
                    >
                      {comp.label}
                    </text>
                  )}

                  {/* Resizing Handles for Mechanical (when selected) */}
                  {isSelected && comp.type.startsWith('mech_') && (
                    <g>
                      {/* Corner Handles for Scale */}
                      {comp.type !== 'mech_vector' && comp.type !== 'mech_trajectory' && comp.type !== 'mech_pulley_fixed' && [
                        { id: 'tl', x: -45, y: -22 },
                        { id: 'tr', x: 45, y: -22 },
                        { id: 'bl', x: -45, y: 22 },
                        { id: 'br', x: 45, y: 22 }
                      ].map(h => (
                        <circle
                          key={h.id}
                          cx={h.x}
                          cy={h.y}
                          r={5}
                          fill="white"
                          stroke="hsl(var(--component-selected))"
                          strokeWidth={1.5}
                          style={{ cursor: 'nwse-resize' }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'scale', h.id)}
                        />
                      ))}

                      {/* End Handle for Length (Spring, Pendulum, Axis) */}
                      {(comp.type === 'mech_spring' || comp.type === 'mech_pendulum' || comp.type === 'mech_axis') && (
                        <circle
                          cx={comp.type === 'mech_pendulum' ? 0 : (comp.value ? parseFloat(comp.value.split(',')[0]) : (comp.type === 'mech_axis' ? 100 : 60))}
                          cy={comp.type === 'mech_pendulum' ? (comp.value ? parseFloat(comp.value.split(',')[0]) : 50) : 0}
                          r={6}
                          fill="hsl(var(--component-selected))"
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: comp.type === 'mech_pendulum' ? 'ns-resize' : 'ew-resize' }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'end')}
                        />
                      )}

                      {/* Angle Handle for Inclined Plane */}
                      {comp.type === 'mech_inclined_plane' && (
                        <circle
                          cx={30}
                          cy={-20}
                          r={6}
                          fill="hsl(var(--component-warning, #f59e0b))"
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'ns-resize' }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'angle', 'angle')}
                        />
                      )}

                      {/* Angle Handle for Cart */}
                      {comp.type === 'mech_cart' && (
                        <circle
                          cx={30}
                          cy={10}
                          r={6}
                          fill="hsl(var(--component-warning, #f59e0b))"
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'ns-resize' }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'angle', 'angle')}
                        />
                      )}

                      {/* Length Handle for Force Vector */}
                      {comp.type === 'mech_vector' && (
                        <circle
                          cx={comp.value ? parseFloat(comp.value.split(',')[1] || '40') : 40}
                          cy={0}
                          r={6}
                          fill="hsl(var(--component-selected))"
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'ew-resize' }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'end_vector')}
                        />
                      )}

                      {/* Handles for Fixed Pulley (Left & Right Strings) */}
                      {comp.type === 'mech_pulley_fixed' && (
                        <g>
                          <circle
                            cx={-22}
                            cy={comp.value ? parseFloat(comp.value.split(',')[0] || '25') : 25}
                            r={6}
                            fill="hsl(var(--component-selected))"
                            stroke="white"
                            strokeWidth={2}
                            style={{ cursor: 'ns-resize' }}
                            onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'length_left')}
                          />
                          <circle
                            cx={22}
                            cy={comp.value && comp.value.split(',').length > 1 ? parseFloat(comp.value.split(',')[1]) : (comp.value ? parseFloat(comp.value.split(',')[0] || '25') : 25)}
                            r={6}
                            fill="hsl(var(--component-selected))"
                            stroke="white"
                            strokeWidth={2}
                            style={{ cursor: 'ns-resize' }}
                            onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'length_right')}
                          />
                        </g>
                      )}

                      {/* Handles for Parabola (Trajectory) */}
                      {comp.type === 'mech_trajectory' && (
                        <g>
                          {/* Width Handle */}
                          <circle
                            cx={comp.value ? parseFloat(comp.value.split(',')[0] || '120') : 120}
                            cy={0}
                            r={6}
                            fill="hsl(var(--component-selected))"
                            stroke="white"
                            strokeWidth={2}
                            style={{ cursor: 'ew-resize' }}
                            onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'end_traj')}
                          />
                          {/* Height Handle */}
                          <circle
                            cx={(comp.value ? parseFloat(comp.value.split(',')[0] || '120') : 120) / 2}
                            cy={-(comp.value ? parseFloat(comp.value.split(',')[1] || '60') : 60)}
                            r={6}
                            fill="hsl(var(--component-warning, #f59e0b))"
                            stroke="white"
                            strokeWidth={2}
                            style={{ cursor: 'ns-resize' }}
                            onMouseDown={(e) => handleResizeHandleMouseDown(e, comp, 'length', 'height_traj')}
                          />
                        </g>
                      )}
                    </g>
                  )}
                </g>

                {/* Interactive connection points */}
                {!isPointLike && !(hideNodes && !drawingWire && !wireDrawing) && connPts.map((cp, i) => {
                  const isHovered = hoveredNode?.compId === comp.id &&
                    Math.hypot(hoveredNode.point.x - cp.x, hoveredNode.point.y - cp.y) < 5;
                  const isMechComp = comp.type.startsWith('mech_');

                  return (
                    <circle
                      key={`${comp.id}_cp_${i}`}
                      cx={cp.x}
                      cy={cp.y}
                      r={isHovered ? 7 : 4}
                      fill={isHovered ? 'hsl(var(--component-selected))' : 'hsl(var(--node-color))'}
                      opacity={isHovered ? 0.9 : (isMechComp ? 0 : 0.5)}
                      style={{ cursor: 'move', transition: 'r 0.15s, opacity 0.15s' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (e.button === 0) {
                          if (mode === 'wire' || e.altKey) {
                            onStartWire(cp);
                            setWireDrawing(true);
                          } else if (mode === 'select') {
                            pushHistory();
                            setDraggingCompNode({ compId: comp.id, oldPoint: cp });
                          }
                        }
                      }}
                      onContextMenu={(e) => handleNodeContextMenu(e, cp, comp.id)}
                    />
                  );
                })}

                {/* Junction/Terminal point */}
                {isPointLike && (
                  <circle
                    cx={comp.x}
                    cy={comp.y}
                    r={hoveredNode?.compId === comp.id ? 7 : 4}
                    fill="transparent"
                    style={{ cursor: 'move' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (e.button === 0) {
                        if (mode === 'wire' || e.altKey) {
                          onStartWire({ x: comp.x, y: comp.y });
                          setWireDrawing(true);
                        } else if (mode === 'select') {
                          pushHistory();
                          setDraggingCompNode({ compId: comp.id, oldPoint: { x: comp.x, y: comp.y } });
                        }
                      }
                    }}
                    onContextMenu={(e) => handleNodeContextMenu(e, { x: comp.x, y: comp.y }, comp.id)}
                  />
                )}
              </g>
            );
          })}

          {/* Marquee */}
          {marqueeRect && marqueeRect.width > 2 && (
            <rect
              x={marqueeRect.x} y={marqueeRect.y}
              width={marqueeRect.width} height={marqueeRect.height}
              fill="hsl(213, 70%, 45%, 0.08)"
              stroke="hsl(213, 70%, 45%)"
              strokeWidth={1} strokeDasharray="6 3"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </g>

        {/* Coordinates */}
        <text x={10} y={20} fontSize={11} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--muted-foreground))">
          ({mousePos.x}, {mousePos.y}) | Zoom: {Math.round(zoom * 100)}%
        </text>
      </svg>

      {/* Junction label input overlay */}
      {junctionLabelInput && (
        <div
          style={{
            position: 'fixed',
            left: junctionLabelInput.x - 40,
            top: junctionLabelInput.y - 50,
            zIndex: 1000,
          }}
        >
          <div className="flex gap-1 p-1.5 rounded-lg shadow-lg border bg-card">
            <input
              autoFocus
              type="text"
              placeholder="A"
              maxLength={4}
              className="w-16 px-2 py-1 text-sm font-mono rounded border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJunctionLabelSubmit((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setJunctionLabelInput(null);
              }}
            />
            <button
              className="px-2 py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:opacity-90"
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                handleJunctionLabelSubmit(input.value);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Node Context Menu Overlay */}
      {nodeContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: nodeContextMenu.x,
            top: nodeContextMenu.y,
            zIndex: 1000,
          }}
          className="flex flex-col min-w-[120px] py-1 bg-popover text-popover-foreground rounded-md border shadow-md text-sm"
          onContextMenu={(e) => e.preventDefault()}
        >
          {nodeContextMenu.wireId && nodeContextMenu.pointIndex !== null && (
            <button
              className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWirePoint(nodeContextMenu.wireId!, nodeContextMenu.pointIndex!);
                setNodeContextMenu(null);
              }}
            >
              Xóa điểm (làm thẳng)
            </button>
          )}

          {(() => {
            const comp = components.find(c => c.id === nodeContextMenu.compId);
            if (comp?.type === 'mech_inclined_plane') {
              const params = comp.value ? comp.value.split(',').map(s => s.trim()) : ['30', '1'];
              const currentAngle = params[0] || '30';
              const currentScale = params[1] || '1';
              return (
                <>
                  <button
                    className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground w-full whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateComponentValue(comp.id, `${currentAngle}, ${currentScale}, ?`);
                      setNodeContextMenu(null);
                    }}
                  >
                    Đổi góc thành "?"
                  </button>
                  <button
                    className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground w-full whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateComponentValue(comp.id, `${currentAngle}, ${currentScale}, hidden`);
                      setNodeContextMenu(null);
                    }}
                  >
                    Ẩn số đo góc
                  </button>
                  <button
                    className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground w-full whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateComponentValue(comp.id, `${currentAngle}, ${currentScale}`);
                      setNodeContextMenu(null);
                    }}
                  >
                    Hiển thị số góc
                  </button>
                </>
              );
            }

            return (
              <>
                {nodeContextMenu.compId && comp?.type === 'junction' && (
                  <button
                    className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponent(nodeContextMenu.compId!, false);
                      pushHistory();
                      setTimeout(() => {
                        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
                      }, 50);
                      setNodeContextMenu(null);
                    }}
                  >
                    Xóa điểm
                  </button>
                )}
                <button
                  className="flex items-center px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJunctionLabelInput({
                      wireId: nodeContextMenu.wireId || '',
                      compId: nodeContextMenu.compId,
                      point: nodeContextMenu.point,
                      x: nodeContextMenu.x,
                      y: nodeContextMenu.y,
                    });
                    setNodeContextMenu(null);
                  }}
                >
                  Đặt tên điểm
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Value Input Popup for Dynamic Mechanical Components */}
      {componentValueInput && (
        <div
          style={{
            position: 'absolute',
            left: componentValueInput.x,
            top: componentValueInput.y,
            transform: 'translate(-50%, -100%)',
            marginTop: '-15px',
            background: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          <input
            autoFocus
            className="text-sm outline-none w-24 bg-transparent"
            placeholder="Tham số..."
            defaultValue={componentValueInput.initialValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val !== null) {
                  updateComponentValue(componentValueInput.compId, val);
                }
                setComponentValueInput(null);
              } else if (e.key === 'Escape') {
                setComponentValueInput(null);
              }
            }}
            onBlur={() => setComponentValueInput(null)}
          />
        </div>
      )}
    </>
  );
};
