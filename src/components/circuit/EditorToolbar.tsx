import React from 'react';
import { MousePointer2, Pen, RotateCcw, Trash2, ZoomIn, ZoomOut, Download, FileText, RotateCw, EyeOff, Eye } from 'lucide-react';

interface Props {
  mode: 'select' | 'wire';
  onModeChange: (mode: 'select' | 'wire') => void;
  onUndo: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  onExport: () => void;
  onRotate: () => void;
  hasSelection: boolean;
  hideNodes: boolean;
  onToggleHideNodes: () => void;
}

export const EditorToolbar: React.FC<Props> = ({
  mode,
  onModeChange,
  onUndo,
  onDelete,
  onZoomIn,
  onZoomOut,
  onClear,
  onExport,
  onRotate,
  hasSelection,
  hideNodes,
  onToggleHideNodes,
}) => {
  const btnBase = "flex items-center justify-center w-9 h-9 rounded-md transition-colors duration-150";
  const btnActive = "bg-primary text-primary-foreground";
  const btnDefault = "hover:bg-secondary text-foreground";

  return (
    <div 
      className="flex items-center gap-1 px-3 py-1.5 border-b"
      style={{ background: 'hsl(var(--toolbar-bg))', borderColor: 'hsl(var(--toolbar-border))' }}
    >
      {/* Mode buttons */}
      <div className="flex items-center gap-0.5 mr-2">
        <button
          className={`${btnBase} ${mode === 'select' ? btnActive : btnDefault}`}
          onClick={() => onModeChange('select')}
          title="Chọn & di chuyển (V)"
        >
          <MousePointer2 size={16} />
        </button>
        <button
          className={`${btnBase} ${mode === 'wire' ? btnActive : btnDefault}`}
          onClick={() => onModeChange('wire')}
          title="Vẽ dây dẫn (W)"
        >
          <Pen size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Edit buttons */}
      <button className={`${btnBase} ${btnDefault}`} onClick={onRotate} title="Xoay (R)" disabled={!hasSelection}>
        <RotateCw size={16} className={!hasSelection ? 'opacity-30' : ''} />
      </button>
      <button className={`${btnBase} ${btnDefault}`} onClick={onDelete} title="Xóa (Del)" disabled={!hasSelection}>
        <Trash2 size={16} className={!hasSelection ? 'opacity-30' : ''} />
      </button>
      <button className={`${btnBase} ${btnDefault}`} onClick={onUndo} title="Hoàn tác (Ctrl+Z)">
        <RotateCcw size={16} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Zoom */}
      <button className={`${btnBase} ${btnDefault}`} onClick={onZoomOut} title="Thu nhỏ">
        <ZoomOut size={16} />
      </button>
      <button className={`${btnBase} ${btnDefault}`} onClick={onZoomIn} title="Phóng to">
        <ZoomIn size={16} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        className={`${btnBase} ${hideNodes ? btnActive : btnDefault}`}
        onClick={onToggleHideNodes}
        title={hideNodes ? 'Hiện node (H)' : 'Ẩn node không tên (H)'}
      >
        {hideNodes ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <button className={`${btnBase} ${btnDefault}`} onClick={onClear} title="Xóa tất cả">
        <FileText size={16} />
      </button>
      <button className={`${btnBase} ${btnDefault}`} onClick={onExport} title="Xuất ảnh">
        <Download size={16} />
      </button>
    </div>
  );
};
