"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { forceSimulation, forceLink } from 'd3';
import styles from './Canvas.module.css';
import { ImageNode, Node, NodeLink } from '../types/nodes';
import { useCanvasDrop } from '../hooks/useCanvasDrop';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { createGridPattern, createBackground, CANVAS_CONSTANTS } from '../services/canvasUtils';

interface CanvasProps {
  nodes: Node[];
  links: NodeLink[];
  onNodesChange: (nodes: Node[]) => void;
  onLinksChange: (links: NodeLink[] | ((prevLinks: NodeLink[]) => NodeLink[])) => void;
}

export default function Canvas({ nodes, links, onNodesChange, onLinksChange }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createDragBehavior = useNodeDrag(nodes, onNodesChange, styles);
  const { handleDragOver, handleDrop } = useCanvasDrop(nodes, onNodesChange, onLinksChange);

  const renderNode = (nodeGroup: d3.Selection<SVGGElement, Node, any, any>) => {
    nodeGroup.each(function(d) {
      const group = d3.select(this);
      
      switch(d.type) {
        case 'icon':
          // Icon container
          const iconContainer = group.append('g')
            .attr('class', 'icon-container');
          
          // SVG icon
          iconContainer.append('path')
            .attr('d', 'M28 4H12C10.9391 4 9.92172 4.42143 9.17157 5.17157C8.42143 5.92172 8 6.93913 8 8V40C8 41.0609 8.42143 42.0783 9.17157 42.8284C9.92172 43.5786 10.9391 44 12 44H36C37.0609 44 38.0783 43.5786 38.8284 42.8284C39.5786 42.0783 40 41.0609 40 40V16M28 4L40 16M28 4V16H40M32 26H16M32 34H16M20 18H16')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', '4')
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'none');
          
          // Title text
          iconContainer.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 40)
            .text(d.title);
          break;

        case 'text':
          const textNode = group.append('g')
            .attr('class', 'text-container');
          
          // Create text element
          const textElement = textNode.append('text')
            .attr('class', styles.nodeText)
            .attr('x', 16)
            .attr('y', 24);
          
          // Split text into words and create tspans for wrapping
          const words = d.content.split(/\s+/);
          let line: string[] = [];
          let lineNumber = 0;
          const maxWidth = 300 - 32; // 300px max width minus padding
          
          // Create temporary tspan to measure text
          let tspan = textElement.append('tspan')
            .attr('x', 16)
            .attr('dy', 0);
          
          words.forEach(word => {
            line.push(word);
            tspan.text(line.join(' '));
            
            if ((tspan.node()?.getComputedTextLength() || 0) > maxWidth) {
              line.pop();
              if (line.length) {
                tspan.text(line.join(' '));
                line = [word];
                lineNumber++;
                tspan = textElement.append('tspan')
                  .attr('x', 16)
                  .attr('dy', '1.2em')
                  .text(word);
              }
            }
          });
          
          // Add remaining words
          if (line.length > 0) {
            if (lineNumber === 0) {
              tspan.text(line.join(' '));
            } else {
              textElement.append('tspan')
                .attr('x', 16)
                .attr('dy', '1.2em')
                .text(line.join(' '));
            }
          }
          
          // Calculate bbox and create background
          const bbox = (textElement.node() as SVGTextElement).getBBox();
          textNode.insert('rect', 'text')
            .attr('width', Math.min(300, bbox.width + 32))
            .attr('height', bbox.height + 32)
            .attr('rx', 5)
            .attr('class', styles.textNode);
          
          break;

        case 'image':
          const imageContainer = group.append('g')
            .attr('class', 'image-container');
          
          imageContainer.append('image')
            .attr('href', d.imageUrl)
            .attr('width', d.width)
            .attr('height', d.height);
          break;
      }
    });
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;

    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const newNode: ImageNode = {
            id: crypto.randomUUID(),
            type: 'image',
            imageUrl,
            width: 200,  // Default width
            height: 200, // Default height
            x: 100,
            y: 100
          };
          onNodesChange([...nodes, newNode]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [nodes, onNodesChange]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create force simulation
    const simulation = forceSimulation(nodes)
      .force("link", forceLink(links)
        .id((d: any) => d.id)
        .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .alphaDecay(0.1)
      .velocityDecay(0.6)
      .on('tick', () => {
        // Only update positions of nodes that aren't being dragged
        nodes.forEach(node => {
          if (!node.fx && !node.fy) {
            node.x = node.x || 0;
            node.y = node.y || 0;
          }
        });
      });

    // Create links
    const linkGroup = svg.append('g')
      .attr('class', 'links');

    const linkElements = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', styles.link);

    // Render nodes
    const nodeGroups = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

    renderNode(nodeGroups);

    // Apply drag behavior
    const drag = createDragBehavior();
    
    drag.on('start', (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      // Fix all other nodes in place
      nodes.forEach(node => {
        if (node.id !== event.subject.id) {
          node.fx = node.x;
          node.fy = node.y;
        }
      });
    })
    .on('drag', function(event, d) {
      d.fx = event.x;
      d.fy = event.y;
      d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);
    })
    .on('end', (event) => {
      if (!event.active) simulation.alphaTarget(0);
      // Release all nodes
      nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      simulation.alpha(0.1).restart();
    });

    nodeGroups.call(drag);

    // Update positions on each tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          return source?.x || 0;
        })
        .attr('y1', d => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          return source?.y || 0;
        })
        .attr('x2', d => {
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          return target?.x || 0;
        })
        .attr('y2', d => {
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          return target?.y || 0;
        });

      nodeGroups.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });
  }, [nodes, links, createDragBehavior]);

  return (
    <div 
      ref={containerRef}
      className={styles.canvas}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, containerRef)}
    >
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
} 