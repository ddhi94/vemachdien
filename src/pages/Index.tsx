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

  const handleDrop = useCallback((type: ComponentType, x: number, y: number) => {
    editor.addComponent(type, x, y, type);
  }, [editor]);

  const handleExport = useCallback(() => {
    const svgElement = document.querySelector('.circuit-grid') as SVGSVGElement;
    if (!svgElement) return;
    
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'so-do-mach-dien.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRotate = useCallback(() => {
    editor.selectedIds.forEach(id => editor.rotateComponent(id));
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'v' || e.key === 'V') setMode('select');
      if (e.key === 'w' || e.key === 'W') setMode('wire');
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
            onExport={handleExport}
            onRotate={handleRotate}
            hasSelection={editor.selectedIds.length > 0}
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
              onMoveComponent={editor.moveComponent}
              onRotateComponent={editor.rotateComponent}
              onClearSelection={editor.clearSelection}
              onStartWire={editor.startDrawingWire}
              onContinueWire={editor.continueDrawingWire}
              onFinishWire={editor.finishDrawingWire}
              onCancelWire={editor.cancelDrawingWire}
              onZoom={editor.handleZoom}
              mode={mode}
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
          {mode === 'select' ? 'Chọn (V)' : 'Vẽ dây (W)'} · Nhấp đúp để xoay · Alt+kéo để cuộn
        </span>
      </div>
    </div>
  );
};

export default Index;
