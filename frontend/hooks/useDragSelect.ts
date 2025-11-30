import { useState, useEffect, useCallback, useRef } from 'react';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface UseDragSelectOptions {
  onSelectionChange: (selectedIds: Set<string>) => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  itemSelector?: string;
}

export const useDragSelect = (
  containerRef: React.RefObject<HTMLElement | null>,
  { onSelectionChange, onDragStart, onDragEnd, itemSelector = '.selectable-item' }: UseDragSelectOptions
) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore right clicks
    if (e.button !== 0) return;

    // Ignore if clicking on a selectable item directly or interactive elements
    if ((e.target as HTMLElement).closest(itemSelector)) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, .MuiIconButton-root')) return;

    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left + containerRef.current.scrollLeft;
    const y = e.clientY - containerRect.top + containerRef.current.scrollTop;

    startPoint.current = { x, y };
    setIsSelecting(true);
    setSelectionBox({ left: x, top: y, width: 0, height: 0 });
    
    if (onDragStart) {
      onDragStart(e);
    }
  }, [containerRef, itemSelector, onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isSelecting || !startPoint.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left + containerRef.current.scrollLeft;
    const currentY = e.clientY - containerRect.top + containerRef.current.scrollTop;

    const left = Math.min(startPoint.current.x, currentX);
    const top = Math.min(startPoint.current.y, currentY);
    const width = Math.abs(currentX - startPoint.current.x);
    const height = Math.abs(currentY - startPoint.current.y);

    setSelectionBox({ left, top, width, height });

    // Calculate intersection
    const items = containerRef.current.querySelectorAll(itemSelector);
    const newSelection = new Set<string>();

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemLeft = itemRect.left - containerRect.left + containerRef.current!.scrollLeft;
      const itemTop = itemRect.top - containerRect.top + containerRef.current!.scrollTop;
      
      if (
        left < itemLeft + itemRect.width &&
        left + width > itemLeft &&
        top < itemTop + itemRect.height &&
        top + height > itemTop
      ) {
        const id = item.getAttribute('data-id');
        if (id) newSelection.add(id);
      }
    });

    onSelectionChange(newSelection);
  }, [isSelecting, containerRef, itemSelector, onSelectionChange]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
      startPoint.current = null;
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [isSelecting, onDragEnd]);

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  return {
    isSelecting,
    selectionBox,
    handleMouseDown
  };
};
