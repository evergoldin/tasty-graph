import { useCallback } from 'react';
import { Node, NodeLink, IconNode, TextNode } from '../types/nodes';
import { ContentBlock } from '../types/content';

export function useCanvasDrop(
  nodes: Node[],
  onNodesChange: (nodes: Node[]) => void,
  onLinksChange: (links: NodeLink[]) => void
) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent, containerRef: React.RefObject<HTMLDivElement>) => {
    e.preventDefault();
    const content = JSON.parse(e.dataTransfer.getData('application/json')) as ContentBlock;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);

    const iconNode: IconNode = {
      id: crypto.randomUUID(),
      type: 'icon',
      title: content.fileName,
      iconPath: 'M12 2L2 7l10 5 10-5-10-5z',
      x,
      y
    };

    const textNode: TextNode = {
      id: crypto.randomUUID(),
      type: 'text',
      content: content.content,
      x: x + 150,
      y
    };

    const link: NodeLink = {
      source: iconNode.id,
      target: textNode.id
    };

    onNodesChange([...nodes, iconNode, textNode]);
    onLinksChange([link]);
  }, [nodes, onNodesChange, onLinksChange]);

  return { handleDragOver, handleDrop };
} 