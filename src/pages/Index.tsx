import React, { useState, useCallback, useEffect } from 'react';
import { ComponentPalette } from '@/components/circuit/ComponentPalette';
import { CircuitCanvas } from '@/components/circuit/CircuitCanvas';
import { EditorToolbar } from '@/components/circuit/EditorToolbar';
import { CircuitParserInput } from '@/components/circuit/CircuitParserInput';
import { useCircuitEditor } from '@/hooks/useCircuitEditor';
import { ComponentType } from '@/types/circuit';
import { Zap } from 'lucide-react';

const Index = () => {
  const editor = useCircuitEditor();
  const [mode, setMode] = useState<'select' | 'wire'>('select');
  const [dragType, setDragType] = useState<ComponentType | null>(null);
  const [hideNodes, setHideNodes] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const handleDrop = useCallback((type: ComponentType, x: number, y: number, label?: string) => {
    editor.addComponent(type, x, y, label || type);
  }, [editor]);

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
    
    // Remove the background rect, coordinates text, and set proper viewBox
    clone.querySelectorAll('.canvas-bg').forEach(el => el.remove());
    // Remove coordinate text (last text element)
    const texts = clone.querySelectorAll(':scope > text');
    texts.forEach(t => t.remove());

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleRotate]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b" style={{ background: 'hsl(var(--palette-bg))', borderColor: 'hsl(var(--palette-hover))' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'hsl(var(--palette-foreground))' }}>
              Sơ Đồ Mạch Điện
            </h1>
            <p className="text-[10px]" style={{ color: 'hsl(var(--status-foreground))' }}>
              Vẽ sơ đồ nguyên lí mạch điện
            </p>
          </div>
        </div>
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
              setPan={editor.setPan}
              onDrop={handleDrop}
              onSelectComponent={editor.selectComponent}
              onSelectMany={editor.selectMany}
              onMoveComponent={editor.moveComponent}
              onMoveSelected={editor.moveSelected}
              onRotateComponent={editor.rotateComponent}
              onToggleSwitch={editor.toggleSwitch}
              onClearSelection={editor.clearSelection}
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
        className="flex items-center justify-between px-4 py-1 text-[11px] font-mono"
        style={{ background: 'hsl(var(--status-bar))', color: 'hsl(var(--status-foreground))' }}
      >
        <span>
          {editor.components.length} linh kiện · {editor.wires.length} dây dẫn
          {editor.selectedIds.length > 0 && ` · ${editor.selectedIds.length} đã chọn`}
        </span>
        <span>
          {mode === 'select' ? 'Chọn (V)' : 'Vẽ dây (W)'} · Kéo từ chấm tròn để nối dây · Nhấp dây để thêm điểm · Nhấp đúp để xoay
        </span>
      </div>
    </div>
  );
};

export default Index;
