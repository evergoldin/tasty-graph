import { useCallback } from 'react';
import { Node, NodeLink, IconNode, TextNode } from '../types/nodes';
import { ContentBlock } from '../types/content';

export function useCanvasDrop(
  nodes: Node[],
  onNodesChange: (nodes: Node[]) => void,
  onLinksChange: (links: NodeLink[] | ((prevLinks: NodeLink[]) => NodeLink[])) => void
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
      iconPath: 'M28 4H12C10.9391 4 9.92172 4.42143 9.17157 5.17157C8.42143 5.92172 8 6.93913 8 8V40C8 41.0609 8.42143 42.0783 9.17157 42.8284C9.92172 43.5786 10.9391 44 12 44H36C37.0609 44 38.0783 43.5786 38.8284 42.8284C39.5786 42.0783 40 41.0609 40 40V16M28 4L40 16M28 4V16H40M32 26H16M32 34H16M20 18H16',
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
    onLinksChange((prevLinks: NodeLink[]) => [...prevLinks, link]);
  }, [nodes, onNodesChange, onLinksChange]);

  return { handleDragOver, handleDrop };
} 