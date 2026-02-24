import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer2, Pen, RotateCw, Trash2, ZoomIn, ZoomOut,
  Download, RotateCcw, EyeOff, Eye, Tag, Sun, Moon, ChevronDown
} from 'lucide-react';

interface Props {
  mode: 'select' | 'wire';
  onModeChange: (mode: 'select' | 'wire') => void;
  onUndo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJPG: () => void;
  onRotate: () => void;
  hasSelection: boolean;
  hideNodes: boolean;
  onToggleHideNodes: () => void;
  showLabels: boolean;
  onToggleShowLabels: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  globalStrokeWidth: number;
  onStrokeWidthChange: (val: number) => void;
}

export const EditorToolbar: React.FC<Props> = ({
  mode, onModeChange, onUndo, onDelete,
  onZoomIn, onZoomOut, onClear,
  onExportSVG, onExportPNG, onExportJPG,
  onRotate, hasSelection,
  hideNodes, onToggleHideNodes,
  showLabels, onToggleShowLabels,
  isDarkMode, onToggleTheme,
  globalStrokeWidth, onStrokeWidthChange,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    if (exportOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const btn = (active: boolean) => `toolbar-btn ${active ? 'toolbar-btn-active' : ''}`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 border-b"
      style={{ background: 'hsl(var(--toolbar-bg))', borderColor: 'hsl(var(--toolbar-border))' }}
    >
      {/* Mode group */}
      <div className="toolbar-group">
        <button className={btn(mode === 'select')} onClick={() => onModeChange('select')} title="Chọn & di chuyển (V)">
          <MousePointer2 size={15} />
        </button>
        <button className={btn(mode === 'wire')} onClick={() => onModeChange('wire')} title="Vẽ dây dẫn (W)">
          <Pen size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Edit group */}
      <div className="toolbar-group">
        <button className={btn(false)} onClick={onRotate} title="Xoay (R)" disabled={!hasSelection}>
          <RotateCw size={15} />
        </button>
        <button className={btn(false)} onClick={onDelete} title="Xóa (Del)" disabled={!hasSelection}>
          <Trash2 size={15} />
        </button>
        <button className={btn(false)} onClick={onUndo} title="Hoàn tác (Ctrl+Z)">
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Zoom group */}
      <div className="toolbar-group">
        <button className={btn(false)} onClick={onZoomOut} title="Thu nhỏ (−)">
          <ZoomOut size={15} />
        </button>
        <button className={btn(false)} onClick={onZoomIn} title="Phóng to (+)">
          <ZoomIn size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* View group */}
      <div className="toolbar-group">
        <button className={btn(hideNodes)} onClick={onToggleHideNodes} title={hideNodes ? 'Hiện node (H)' : 'Ẩn node (H)'}>
          {hideNodes ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button className={btn(showLabels)} onClick={onToggleShowLabels} title={showLabels ? 'Ẩn tên (L)' : 'Hiện tên (L)'}>
          <Tag size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Stroke width */}
      <div className="flex items-center gap-2 px-1" title="Độ rộng nét vẽ">
        <span className="text-[10px] font-mono font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {globalStrokeWidth}px
        </span>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          value={globalStrokeWidth}
          onChange={(e) => onStrokeWidthChange(parseFloat(e.target.value))}
          className="w-14"
        />
      </div>

      <div className="toolbar-sep" />

      {/* Theme */}
      <button className={btn(false)} onClick={onToggleTheme} title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}>
        {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="flex-1" />

      {/* Export dropdown */}
      <div className="relative" ref={exportRef}>
        <button
          className={`toolbar-btn flex items-center gap-1 w-auto px-2.5 ${exportOpen ? 'toolbar-btn-active' : ''}`}
          onClick={() => setExportOpen(!exportOpen)}
          title="Xuất file"
        >
          <Download size={14} />
          <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
        </button>

        {exportOpen && (
          <div className="export-dropdown">
            <button onClick={() => { onExportSVG(); setExportOpen(false); }}>
              <Download size={14} />
              <span>SVG</span>
            </button>
            <button onClick={() => { onExportPNG(); setExportOpen(false); }}>
              <Download size={14} />
              <span>PNG</span>
            </button>
            <button onClick={() => { onExportJPG(); setExportOpen(false); }}>
              <Download size={14} />
              <span>JPG</span>
            </button>
            <div className="h-px mx-2" style={{ background: 'hsl(var(--border))' }} />
            <button onClick={() => { onClear(); setExportOpen(false); }} className="!text-red-500">
              <Trash2 size={14} />
              <span>Xóa tất cả</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
