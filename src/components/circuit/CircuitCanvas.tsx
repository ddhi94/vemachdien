import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  onDrop: (type: ComponentType, x: number, y: number) => void;
  onSelectComponent: (id: string, multi: boolean) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onRotateComponent: (id: string) => void;
  onClearSelection: () => void;
  onStartWire: (p: Point) => void;
  onContinueWire: (p: Point) => void;
  onFinishWire: () => void;
  onCancelWire: () => void;
  onZoom: (delta: number) => void;
  mode: 'select' | 'wire';
}

const snapToGrid = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

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
  onMoveComponent,
  onRotateComponent,
  onClearSelection,
  onStartWire,
  onContinueWire,
  onFinishWire,
  onCancelWire,
  onZoom,
  mode,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  const getSVGPoint = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      onZoom(e.deltaY > 0 ? -0.1 : 0.1);
    } else {
      setPan({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  }, [pan, setPan, onZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+click to pan
      setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
      return;
    }

    if (e.button === 0 && mode === 'wire') {
      const point = getSVGPoint(e.clientX, e.clientY);
      if (drawingWire) {
        onContinueWire(point);
      } else {
        onStartWire(point);
      }
      return;
    }

    if (e.button === 0 && mode === 'select') {
      // Check if clicking on empty space
      const target = e.target as SVGElement;
      if (target === svgRef.current || target.classList.contains('canvas-bg')) {
        onClearSelection();
      }
    }
  }, [mode, pan, getSVGPoint, drawingWire, onStartWire, onContinueWire, onClearSelection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getSVGPoint(e.clientX, e.clientY);
    setMousePos({ x: snapToGrid(point.x), y: snapToGrid(point.y) });

    if (panning) {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      });
      return;
    }

    if (dragging) {
      const x = point.x - dragging.offsetX;
      const y = point.y - dragging.offsetY;
      onMoveComponent(dragging.id, x, y);
    }
  }, [getSVGPoint, panning, dragging, setPan, onMoveComponent]);

  const handleMouseUp = useCallback(() => {
    if (panning) setPanning(null);
    if (dragging) setDragging(null);
  }, [panning, dragging]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (mode === 'wire' && drawingWire) {
      onFinishWire();
    }
  }, [mode, drawingWire, onFinishWire]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    if (type) {
      const point = getSVGPoint(e.clientX, e.clientY);
      onDrop(type, point.x, point.y);
    }
  }, [getSVGPoint, onDrop]);

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
    onRotateComponent(comp.id);
  }, [onRotateComponent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelWire();
        onClearSelection();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancelWire, onClearSelection]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full circuit-grid"
      style={{ 
        cursor: mode === 'wire' ? 'crosshair' : (panning ? 'grabbing' : 'default'),
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
      {/* Background rect for click detection */}
      <rect className="canvas-bg" x="-10000" y="-10000" width="20000" height="20000" fill="transparent" />
      
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Wires */}
        {wires.map(wire => (
          <g key={wire.id}>
            <polyline
              points={wire.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={selectedIds.includes(wire.id) ? 'hsl(var(--component-selected))' : 'hsl(var(--wire-color))'}
              strokeWidth={2}
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectComponent(wire.id, e.shiftKey); }}
            />
            {/* Connection dots */}
            {wire.points.map((p, i) => (
              (i === 0 || i === wire.points.length - 1) && (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--node-color))" />
              )
            ))}
          </g>
        ))}

        {/* Drawing wire preview */}
        {drawingWire && drawingWire.length > 0 && (
          <g>
            <polyline
              points={[...drawingWire, mousePos].map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="hsl(var(--component-selected))"
              strokeWidth={2}
              strokeDasharray="6 3"
              opacity={0.7}
            />
          </g>
        )}

        {/* Components */}
        {components.map(comp => {
          const isSelected = selectedIds.includes(comp.id);
          return (
            <g
              key={comp.id}
              transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
              style={{ cursor: mode === 'select' ? 'move' : 'default' }}
              onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              onDoubleClick={(e) => handleComponentDblClick(e, comp)}
            >
              {/* Selection highlight */}
              {isSelected && (
                <rect
                  x={-35} y={-22} width={70} height={44}
                  fill="none"
                  stroke="hsl(var(--component-selected))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  rx={4}
                />
              )}
              
              {/* Symbol */}
              {renderSymbolOnCanvas(
                comp.type,
                isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 30%, 20%)',
                2,
                60
              )}
              
              {/* Label */}
              <text
                x={0}
                y={comp.rotation === 90 || comp.rotation === 270 ? 25 : -20}
                fontSize={11}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={500}
                fill={isSelected ? 'hsl(213, 70%, 45%)' : 'hsl(215, 25%, 35%)'}
                textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {comp.label}
              </text>

              {/* Connection points */}
              <circle cx={-30} cy={0} r={4} fill="hsl(var(--node-color))" opacity={0.5} />
              <circle cx={30} cy={0} r={4} fill="hsl(var(--node-color))" opacity={0.5} />
            </g>
          );
        })}
      </g>

      {/* Coordinates display */}
      <text x={10} y={20} fontSize={11} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--muted-foreground))">
        ({mousePos.x}, {mousePos.y}) | Zoom: {Math.round(zoom * 100)}%
      </text>
    </svg>
  );
};
