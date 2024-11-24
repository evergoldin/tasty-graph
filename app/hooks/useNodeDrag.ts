import { useCallback } from 'react';
import * as d3 from 'd3';
import { ContentBlock } from '../types/content';

export function useNodeDrag(
  nodes: ContentBlock[],
  onNodesChange: (nodes: ContentBlock[]) => void,
  styles: { [key: string]: string }
) {
  const handleDragStart = useCallback((event: d3.D3DragEvent<SVGGElement, ContentBlock, any>) => {
    const currentNode = d3.select(event.sourceEvent.target.closest('.node'));
    currentNode.raise().classed(styles.dragging, true);
  }, [styles]);

  const handleDragMove = useCallback((event: d3.D3DragEvent<SVGGElement, ContentBlock, any>, d: ContentBlock) => {
    const currentNode = d3.select(event.sourceEvent.target.closest('.node'));
    const newX = (d.x || 0) + event.dx;
    const newY = (d.y || 0) + event.dy;
    
    currentNode.attr("transform", `translate(${newX}, ${newY})`);
    d.x = newX;
    d.y = newY;
  }, []);

  const handleDragEnd = useCallback((
    event: d3.D3DragEvent<SVGGElement, ContentBlock, any>,
    d: ContentBlock
  ) => {
    const currentNode = d3.select(event.sourceEvent.target.closest('.node'));
    currentNode.classed(styles.dragging, false);
    
    const updatedNodes = nodes.map((node) => 
      node.id === d.id ? { ...node, x: d.x, y: d.y } : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange, styles]);

  return useCallback(() => {
    return d3.drag<SVGGElement, ContentBlock>()
      .on("start", handleDragStart)
      .on("drag", handleDragMove)
      .on("end", handleDragEnd);
  }, [handleDragStart, handleDragMove, handleDragEnd]);
} 