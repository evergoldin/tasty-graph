import { useCallback } from 'react';
import * as d3 from 'd3';
import { ContentBlock } from '../types/content';

export function useNodeDrag(nodes: ContentBlock[], onNodesChange: (nodes: ContentBlock[]) => void, styles: any) {
  return useCallback(() => {
    return d3.drag<SVGGElement, ContentBlock>()
      .subject(function(event) {
        // Get current transform
        const transform = d3.select(this).attr("transform");
        const translate = transform.match(/translate\(([^)]+)\)/)?.[1].split(',').map(Number) || [0, 0];
        
        return {
          x: translate[0],
          y: translate[1]
        };
      })
      .on('start', function(event) {
        // Add dragging class for visual feedback
        d3.select(this).classed(styles.dragging, true);
      })
      .on('drag', function(event, d) {
        // Use event.x and event.y directly for smoother movement
        d3.select(this)
          .attr('transform', `translate(${event.x}, ${event.y})`);
      })
      .on('end', function(event, d) {
        // Remove dragging class
        d3.select(this).classed(styles.dragging, false);
        
        // Update node positions in state
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
      });
  }, [nodes, onNodesChange, styles]);
} 