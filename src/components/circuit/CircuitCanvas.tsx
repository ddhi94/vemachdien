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
  onRotateComponent: (id: string) => void;
  onToggleSwitch: (id: string) => void;
  onClearSelection: () => void;
  onStartWire: (p: Point) => void;
  onFinishWire: (endPoint?: Point) => void;
  onCancelWire: () => void;
  onZoom: (delta: number) => void;
  onAddJunctionOnWire: (wireId: string, point: Point, label: string) => void;
  getConnectionPoints: (comp: CircuitComponent) => Point[];
  findNearestConnectionPoint: (point: Point, threshold?: number) => { compId: string; point: Point } | null;
  mode: 'select' | 'wire';
  hideNodes: boolean;
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
  onRotateComponent,
  onToggleSwitch,
  onClearSelection,
  onStartWire,
  onFinishWire,
  onCancelWire,
  onZoom,
  onAddJunctionOnWire,
  getConnectionPoints,
  findNearestConnectionPoint,
  mode,
  hideNodes,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [rawMousePos, setRawMousePos] = useState<Point>({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ compId: string; point: Point } | null>(null);
  const [wireDrawing, setWireDrawing] = useState(false); // true when dragging from a connection point
  const [wireClickedOnWire, setWireClickedOnWire] = useState<{ wireId: string; point: Point } | null>(null);
  const [junctionLabelInput, setJunctionLabelInput] = useState<{ wireId: string; point: Point; x: number; y: number } | null>(null);

  const getSVGPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Get screen position from SVG point
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
    return pts;
  }, [components, getConnectionPoints]);

  // Find snap target near mouse
  const snapTarget = useMemo(() => {
    if (!wireDrawing && !drawingWire) return null;
    const threshold = 20;
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
    // Close junction label input if clicking elsewhere
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
        // Check snap to connection point
        const snap = findNearestConnectionPoint(point, 20);
        if (snap) {
          onFinishWire(snap.point);
        } else {
          onFinishWire(point);
        }
      } else {
        const snap = findNearestConnectionPoint(point, 20);
        onStartWire(snap ? snap.point : point);
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
  }, [mode, pan, getSVGPoint, drawingWire, onStartWire, onFinishWire, onClearSelection, findNearestConnectionPoint, junctionLabelInput]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getSVGPoint(e.clientX, e.clientY);
    const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
    setMousePos(snapped);
    setRawMousePos(point);

    // Check hover over connection points in select mode
    if (mode === 'select' && !dragging && !marquee) {
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
      // Wire is being drawn by dragging from connection point - just update mouse pos
      return;
    }

    if (dragging) {
      const x = point.x - dragging.offsetX;
      const y = point.y - dragging.offsetY;
      onMoveComponent(dragging.id, x, y);
    }
  }, [getSVGPoint, panning, dragging, marquee, wireDrawing, drawingWire, mode, setPan, onMoveComponent, findNearestConnectionPoint]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (panning) setPanning(null);

    // Finish drag-wire
    if (wireDrawing && drawingWire) {
      const point = getSVGPoint(e.clientX, e.clientY);
      const snap = findNearestConnectionPoint(point, 20);
      if (snap) {
        onFinishWire(snap.point);
      } else {
        onFinishWire(point);
      }
      setWireDrawing(false);
      return;
    }

    if (dragging) setDragging(null);

    if (marquee) {
      const x1 = Math.min(marquee.startX, marquee.currentX);
      const y1 = Math.min(marquee.startY, marquee.currentY);
      const x2 = Math.max(marquee.startX, marquee.currentX);
      const y2 = Math.max(marquee.startY, marquee.currentY);

      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const hitIds: string[] = [];
        components.forEach(comp => {
          if (comp.x + 30 >= x1 && comp.x - 30 <= x2 && comp.y + 15 >= y1 && comp.y - 15 <= y2) {
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
  }, [panning, dragging, marquee, wireDrawing, drawingWire, components, wires, getSVGPoint, findNearestConnectionPoint, onFinishWire, onSelectMany]);

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

  // Start wire from connection point by dragging
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, compPoint: Point) => {
    e.stopPropagation();
    e.preventDefault();
    onStartWire(compPoint);
    setWireDrawing(true);
  }, [onStartWire]);

  const handleComponentMouseDown = useCallback((e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (mode === 'select') {
      onSelectComponent(comp.id, e.shiftKey);
      const point = getSVGPoint(e.clientX, e.clientY);
      setDragging({ id: comp.id, offsetX: point.x - comp.x, offsetY: point.y - comp.y });
    }
  }, [mode, getSVGPoint, onSelectComponent]);

  const handleComponentDblClick = useCallback((e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    if (comp.type === 'switch_open' || comp.type === 'switch_closed') {
      onToggleSwitch(comp.id);
    } else {
      onRotateComponent(comp.id);
    }
  }, [onRotateComponent, onToggleSwitch]);

  // Click on wire to add junction
  const handleWireClick = useCallback((e: React.MouseEvent, wireId: string) => {
    e.stopPropagation();
    if (mode === 'select') {
      if (e.shiftKey) {
        onSelectComponent(wireId, true);
        return;
      }
      // Show + button on wire
      const point = getSVGPoint(e.clientX, e.clientY);
      const snapped = { x: snapToGrid(point.x), y: snapToGrid(point.y) };
      setWireClickedOnWire({ wireId, point: snapped });
    } else {
      onSelectComponent(wireId, e.shiftKey);
    }
  }, [mode, getSVGPoint, onSelectComponent]);

  // Handle clicking the + button on a wire
  const handleAddJunctionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wireClickedOnWire) return;
    const screenPos = getScreenPos(wireClickedOnWire.point);
    setJunctionLabelInput({
      wireId: wireClickedOnWire.wireId,
      point: wireClickedOnWire.point,
      x: screenPos.x,
      y: screenPos.y,
    });
    setWireClickedOnWire(null);
  }, [wireClickedOnWire, getScreenPos]);

  const handleJunctionLabelSubmit = useCallback((label: string) => {
    if (junctionLabelInput && label.trim()) {
      onAddJunctionOnWire(junctionLabelInput.wireId, junctionLabelInput.point, label.trim().toUpperCase());
    }
    setJunctionLabelInput(null);
  }, [junctionLabelInput, onAddJunctionOnWire]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelWire();
        onClearSelection();
        setWireClickedOnWire(null);
        setJunctionLabelInput(null);
        setWireDrawing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancelWire, onClearSelection]);

  // Clear wire click when clicking elsewhere
  useEffect(() => {
    if (selectedIds.length > 0) setWireClickedOnWire(null);
  }, [selectedIds]);

  const marqueeRect = marquee ? {
    x: Math.min(marquee.startX, marquee.currentX),
    y: Math.min(marquee.startY, marquee.currentY),
    width: Math.abs(marquee.currentX - marquee.startX),
    height: Math.abs(marquee.currentY - marquee.startY),
  } : null;

  // Compute wire preview endpoint with snapping
  const wirePreviewEnd = useMemo(() => {
    if (!drawingWire || drawingWire.length === 0) return mousePos;
    if (snapTarget) return snapTarget.point;
    return mousePos;
  }, [drawingWire, mousePos, snapTarget]);

  // Build orthogonal preview path
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
                : (hoveredNode ? 'crosshair' : 'default'))),
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
          {wires.map(wire => (
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
              <polyline
                points={wire.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={selectedIds.includes(wire.id) ? 'hsl(var(--component-selected))' : 'hsl(var(--wire-color))'}
                strokeWidth={2}
                strokeLinejoin="round"
                style={{ cursor: 'pointer', pointerEvents: 'none' }}
              />
              {/* Endpoint dots - interactive for starting wires */}
              {wire.points.map((p, i) => {
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
                      onMouseDown={(e) => handleNodeMouseDown(e, { x: p.x, y: p.y })}
                    />
                  </g>
                );
              })}
            </g>
          ))}

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
              {/* Snap indicator */}
              {snapTarget && (
                <circle
                  cx={snapTarget.point.x}
                  cy={snapTarget.point.y}
                  r={8}
                  fill="none"
                  stroke="hsl(170, 55%, 42%)"
                  strokeWidth={2}
                  opacity={0.8}
                />
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
                  onDoubleClick={(e) => handleComponentDblClick(e, comp)}
                >
                  {/* Selection highlight */}
                  {isSelected && !isPointLike && (
                    <rect x={-35} y={-22} width={70} height={44} fill="none" stroke="hsl(var(--component-selected))" strokeWidth={1.5} strokeDasharray="4 2" rx={4} />
                  )}
                  {isSelected && isPointLike && (
                    <circle cx={0} cy={0} r={12} fill="none" stroke="hsl(var(--component-selected))" strokeWidth={1.5} strokeDasharray="4 2" />
                  )}

                  {/* Symbol */}
                  {renderSymbolOnCanvas(
                    comp.type,
                    isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 30%, 20%)',
                    2, 60
                  )}

                  {/* Label - hide for terminals since symbol already shows +/− */}
                  {!isTerminal && (
                    <text
                      x={0}
                      y={isPointLike ? -12 : (comp.rotation === 90 || comp.rotation === 270 ? 25 : -20)}
                      fontSize={isPointLike ? 13 : 11}
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight={isPointLike ? 700 : 500}
                      fill={isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 25%, 35%)'}
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {comp.label}
                    </text>
                  )}
                </g>

                {/* Interactive connection points - show when not hiding or when drawing */}
                {!isPointLike && !(hideNodes && !drawingWire && !wireDrawing) && connPts.map((cp, i) => {
                  const isHovered = hoveredNode?.compId === comp.id &&
                    Math.hypot(hoveredNode.point.x - cp.x, hoveredNode.point.y - cp.y) < 5;
                  return (
                    <circle
                      key={`${comp.id}_cp_${i}`}
                      cx={cp.x}
                      cy={cp.y}
                      r={isHovered ? 7 : 4}
                      fill={isHovered ? 'hsl(var(--component-selected))' : 'hsl(var(--node-color))'}
                      opacity={isHovered ? 0.9 : 0.5}
                      style={{ cursor: 'crosshair', transition: 'r 0.15s, opacity 0.15s' }}
                      onMouseDown={(e) => handleNodeMouseDown(e, cp)}
                    />
                  );
                })}

                {/* Junction/Terminal point - also draggable for wire */}
                {isPointLike && (
                  <circle
                    cx={comp.x}
                    cy={comp.y}
                    r={hoveredNode?.compId === comp.id ? 7 : 4}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseDown={(e) => handleNodeMouseDown(e, { x: comp.x, y: comp.y })}
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
    </>
  );
};
