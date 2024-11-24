import { useCallback } from 'react';
import * as d3 from 'd3';
import { Node } from '../types/nodes';

export function useNodeDrag(
  nodes: Node[], 
  onNodesChange: (nodes: Node[]) => void, 
  styles: any
) {
  return useCallback(() => {
    let dragStarted = false;
    
    return d3.drag<SVGGElement, Node>()
      .subject(function(event) {
        const transform = d3.select(this).attr("transform");
        const translate = transform.match(/translate\(([^)]+)\)/)?.[1].split(',').map(Number) || [0, 0];
        
        return {
          x: translate[0],
          y: translate[1]
        };
      })
      .on('start', function(event) {
        dragStarted = false;
        d3.select(this).classed(styles.dragging, true);
      })
      .on('drag', function(event, d) {
        dragStarted = true;
        event.sourceEvent.preventDefault(); // Prevent click when dragging
        
        d3.select(this)
          .attr('transform', `translate(${event.x}, ${event.y})`);
        
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
      })
      .on('end', function(event) {
        if (dragStarted) {
          event.sourceEvent.preventDefault(); // Prevent click when drag ends
        }
        d3.select(this).classed(styles.dragging, false);
      });
  }, [nodes, onNodesChange, styles]);
} 