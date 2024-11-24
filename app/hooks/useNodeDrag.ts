import { useCallback } from 'react';
import * as d3 from 'd3';
import { ContentBlock } from '../types/content';

export function useNodeDrag(
  nodes: ContentBlock[], 
  onNodesChange: (nodes: ContentBlock[]) => void, 
  styles: any,
  onNodeClick?: (node: ContentBlock) => void
) {
  return useCallback(() => {
    let isDragging = false;
    let startX: number;
    let startY: number;

    return d3.drag<SVGGElement, ContentBlock>()
      .subject(function(event) {
        const transform = d3.select(this).attr("transform");
        const translate = transform.match(/translate\(([^)]+)\)/)?.[1].split(',').map(Number) || [0, 0];
        
        return {
          x: translate[0],
          y: translate[1]
        };
      })
      .on('start', function(event) {
        isDragging = false;
        startX = event.x;
        startY = event.y;
        d3.select(this).classed(styles.dragging, true);
      })
      .on('drag', function(event, d) {
        // Check if the node has moved more than a small threshold
        if (Math.abs(event.x - startX) > 3 || Math.abs(event.y - startY) > 3) {
          isDragging = true;
        }
        
        d3.select(this)
          .attr('transform', `translate(${event.x}, ${event.y})`);
      })
      .on('end', function(event, d) {
        d3.select(this).classed(styles.dragging, false);
        
        if (!isDragging && onNodeClick) {
          // If we didn't drag (just clicked), call the click handler
          onNodeClick(d);
        } else if (isDragging) {
          // Only update position if we actually dragged
          const updatedNodes = nodes.map(node => {
            if (node.id === d.id) {
              return {
                ...node,
                x: event.x,
                y: event.y
              };
            }
            return node;
          });
          
          onNodesChange(updatedNodes);
        }
      });
  }, [nodes, onNodesChange, styles, onNodeClick]);
} 