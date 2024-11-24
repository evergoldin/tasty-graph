import { useCallback } from 'react';
import { ContentBlock } from '../types/content';

export function useCanvasDrop(
  nodes: ContentBlock[],
  onNodesChange: (nodes: ContentBlock[]) => void
) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent, containerRef: React.RefObject<HTMLDivElement>) => {
    e.preventDefault();
    const content = JSON.parse(e.dataTransfer.getData('application/json'));
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    onNodesChange([...nodes, { ...content, x, y }]);
  }, [nodes, onNodesChange]);

  return { handleDragOver, handleDrop };
} 