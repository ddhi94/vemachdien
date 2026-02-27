import React, { useState, useCallback, useEffect } from 'react';
import { ComponentPalette } from '@/components/circuit/ComponentPalette';
import { CircuitCanvas } from '@/components/circuit/CircuitCanvas';
import { EditorToolbar } from '@/components/circuit/EditorToolbar';
import { CircuitParserInput } from '@/components/circuit/CircuitParserInput';
import { useCircuitEditor } from '@/hooks/useCircuitEditor';
import { ComponentType } from '@/types/circuit';
import { Zap } from 'lucide-react';
import { parseCircuitNotation } from '@/lib/circuitParser';

const Index = () => {
  const editor = useCircuitEditor();
  const [mode, setMode] = useState<'select' | 'wire'>('select');
  const [dragType, setDragType] = useState<ComponentType | null>(null);
  const [hideNodes, setHideNodes] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [globalStrokeWidth, setGlobalStrokeWidth] = useState<number>(2);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleDrop = useCallback((type: ComponentType, x: number, y: number, label?: string) => {
    editor.addComponent(type, x, y, label || type);
  }, [editor]);

  const TEMPLATES = [
    { name: 'Mạch nối tiếp cơ bản', code: 'R1 nt R2 nt Đ' },
    { name: 'Mạch song song cơ bản', code: 'R1 // R2' },
    { name: 'Mạch cầu thang (Khóa 2 chiều)', code: 'U nt (Km // Kd) nt Đ' },
    { name: 'Hệ cơ học: Lò xo & Vật nặng', code: 'gd nt lx nt m' },
    { name: 'Mạch cầu Wheatstone', code: '(R1 // R2) nt (R3 // R4) // V' },
    { name: 'Mạch hỗn hợp nâng cao', code: 'R1 nt (R2 // R3) nt (R4 // R5)' },
    { name: 'Mạch Ampe kế & Biến trở', code: 'U nt A nt Rb nt Đ' },
    { name: 'Ném xiên - Động lực học', code: 'trục_x nt trục_y nt ném nt v nt dóng' },
    { name: 'Chuông điện', code: 'U nt K nt Ch' },
  ];

  const applyTemplate = (code: string) => {
    const result = parseCircuitNotation(code);
    editor.loadParsedCircuit(result.components, result.wires);
  };

  // Calculate bounding box of all content
  const getContentBounds = useCallback(() => {
    const padding = 38; // ~1cm at 96dpi
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    editor.components.forEach(comp => {
      const margin = comp.type === 'junction' || comp.type === 'terminal_positive' || comp.type === 'terminal_negative' ? 20 : 40;
      minX = Math.min(minX, comp.x - margin);
      minY = Math.min(minY, comp.y - margin);
      maxX = Math.max(maxX, comp.x + margin);
      maxY = Math.max(maxY, comp.y + margin);
    });
    editor.wires.forEach(wire => {
      wire.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    if (!isFinite(minX)) return { x: 0, y: 0, width: 200, height: 200 };
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [editor.components, editor.wires]);

  const buildExportSVG = useCallback(() => {
    const svgElement = document.querySelector('.circuit-grid') as SVGSVGElement;
    if (!svgElement) return null;

    const bounds = getContentBounds();
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Remove the background rect, coordinates text
    clone.querySelectorAll('.canvas-bg').forEach(el => el.remove());
    const texts = clone.querySelectorAll(':scope > text');
    texts.forEach(t => t.remove());

    // Remove transparent hit-area elements (invisible in export but clutter the file)
    clone.querySelectorAll('polyline[stroke="transparent"], line[stroke="transparent"], rect[fill="transparent"], circle[fill="transparent"]').forEach(el => el.remove());

    // Resolve CSS variables to actual colors for standalone SVG
    const rootStyle = getComputedStyle(document.documentElement);
    const resolveVar = (val: string): string => {
      const match = val.match(/hsl\(var\(--([^)]+)\)\)/);
      if (match) {
        const cssVal = rootStyle.getPropertyValue(`--${match[1]}`).trim();
        if (cssVal) return `hsl(${cssVal})`;
      }
      return val;
    };
    clone.querySelectorAll('*').forEach(el => {
      const htmlEl = el as SVGElement;
      ['stroke', 'fill'].forEach(attr => {
        const val = htmlEl.getAttribute(attr);
        if (val && val.includes('var(--')) {
          htmlEl.setAttribute(attr, resolveVar(val));
        }
      });
    });

    // Find the transform group and remove pan/zoom transform
    const mainG = clone.querySelector('g');
    if (mainG) {
      mainG.setAttribute('transform', `translate(${-bounds.x}, ${-bounds.y})`);
    }

    clone.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    clone.setAttribute('width', String(bounds.width));
    clone.setAttribute('height', String(bounds.height));
    clone.style.background = 'white';
    clone.removeAttribute('class');

    return { clone, bounds };
  }, [getContentBounds]);

  const handleExportSVG = useCallback(() => {
    const result = buildExportSVG();
    if (!result) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(result.clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'so-do-mach-dien.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [buildExportSVG]);

  const handleExportImage = useCallback((format: 'png' | 'jpg') => {
    const result = buildExportSVG();
    if (!result) return;
    const { clone, bounds } = result;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 2; // retina
      const canvas = document.createElement('canvas');
      canvas.width = bounds.width * scale;
      canvas.height = bounds.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `so-do-mach-dien.${format}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }, mimeType, 0.95);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [buildExportSVG]);

  const handleRotate = useCallback(() => {
    editor.selectedIds.forEach(id => editor.rotateComponent(id));
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'v' || e.key === 'V') setMode('select');
      if (e.key === 'w' || e.key === 'W') setMode('wire');
      if (e.key === 'h' || e.key === 'H') setHideNodes(prev => !prev);
      if (e.key === 'l' || e.key === 'L') setShowLabels(prev => !prev);
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedIds.length > 0) {
        editor.deleteSelected();
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        editor.undo();
      }
      if (e.key.startsWith('Arrow') && editor.selectedIds.length > 0) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -delta;
        if (e.key === 'ArrowDown') dy = delta;
        if (e.key === 'ArrowLeft') dx = -delta;
        if (e.key === 'ArrowRight') dx = delta;
        editor.moveSelected(editor.selectedIds, dx, dy);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleRotate, setMode, setHideNodes, setShowLabels]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 py-1.5 border-b" style={{ background: 'hsl(var(--palette-bg))', borderColor: 'hsl(var(--palette-hover))' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
            <Zap size={15} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold leading-tight" style={{ color: 'hsl(var(--palette-foreground))' }}>
              Circuit Sketcher
            </h1>
            <p className="text-[9px] font-mono leading-tight" style={{ color: 'hsl(var(--status-foreground))' }}>
              by Hieudd
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <select
          className="text-[11px] rounded-md px-2.5 py-1 outline-none cursor-pointer"
          style={{ background: 'hsl(var(--palette-hover))', color: 'hsl(var(--palette-foreground))', border: '1px solid hsl(var(--palette-active))' }}
          onChange={(e) => e.target.value && applyTemplate(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Mẫu sơ đồ ▾</option>
          {TEMPLATES.map(t => (
            <option key={t.name} value={t.code}>{t.name}</option>
          ))}
        </select>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <ComponentPalette onDragStart={setDragType} />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorToolbar
            mode={mode}
            onModeChange={setMode}
            onUndo={editor.undo}
            onDelete={editor.deleteSelected}
            onZoomIn={() => editor.handleZoom(0.1)}
            onZoomOut={() => editor.handleZoom(-0.1)}
            onClear={editor.clearAll}
            onExportSVG={handleExportSVG}
            onExportPNG={() => handleExportImage('png')}
            onExportJPG={() => handleExportImage('jpg')}
            onRotate={handleRotate}
            hasSelection={editor.selectedIds.length > 0}
            hideNodes={hideNodes}
            onToggleHideNodes={() => setHideNodes(prev => !prev)}
            showLabels={showLabels}
            onToggleShowLabels={() => setShowLabels(prev => !prev)}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(prev => !isDarkMode)}
            globalStrokeWidth={globalStrokeWidth}
            onStrokeWidthChange={setGlobalStrokeWidth}
          />

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <CircuitCanvas
              components={editor.components}
              wires={editor.wires}
              selectedIds={editor.selectedIds}
              drawingWire={editor.drawingWire}
              pan={editor.pan}
              zoom={editor.zoom}
              globalStrokeWidth={globalStrokeWidth}
              setPan={editor.setPan}
              onDrop={handleDrop}
              onSelectComponent={editor.selectComponent}
              onSelectMany={editor.selectMany}
              onMoveComponent={editor.moveComponent}
              onMoveComponentNode={editor.moveComponentNode}
              onMoveSelected={editor.moveSelected}
              onRotateComponent={editor.rotateComponent}
              onFlipComponent={editor.flipComponent}
              onToggleSwitch={editor.toggleSwitch}
              onUpdateComponentPosition={editor.updateComponentPosition}
              onUpdateComponentRotation={editor.updateComponentRotation}
              onClearSelection={editor.clearSelection}
              updateComponentValue={editor.updateComponentValue}
              onStartWire={editor.startDrawingWire}
              onFinishWire={editor.finishDrawingWire}
              onCancelWire={editor.cancelDrawingWire}
              onZoom={editor.handleZoom}
              onAddJunctionOnWire={editor.addJunctionOnWire}
              onMoveWirePoint={editor.moveWirePoint}
              onInsertWirePoint={editor.insertWirePoint}
              onDeleteWirePoint={editor.deleteWirePoint}
              getConnectionPoints={editor.getConnectionPoints}
              findNearestConnectionPoint={editor.findNearestConnectionPoint}
              pushHistory={editor.pushHistory}
              setComponentLabel={editor.setComponentLabel}
              moveLabel={editor.moveLabel}
              onToggleTerminals={editor.toggleTerminals}
              mode={mode}
              hideNodes={hideNodes}
              showLabels={showLabels}
            />
          </div>

          {/* Parser input */}
          <CircuitParserInput onParse={editor.loadParsedCircuit} />
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-0.5 text-[10px] font-mono"
        style={{ background: 'hsl(var(--status-bar))', color: 'hsl(var(--status-foreground))' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--accent))' }} />
          {editor.components.length} linh kiện
          <span className="opacity-40">·</span>
          {editor.wires.length} dây
          {editor.selectedIds.length > 0 && (
            <><span className="opacity-40">·</span>{editor.selectedIds.length} chọn</>
          )}
        </span>
        <span className="opacity-60">
          {mode === 'select' ? 'V: Chọn' : 'W: Vẽ dây'} · R: Xoay · Del: Xóa · H: Ẩn node
        </span>
      </div>
    </div>
  );
};

export default Index;
