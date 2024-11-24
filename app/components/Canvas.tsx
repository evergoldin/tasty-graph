"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import styles from './Canvas.module.css';
import { ImageNode, Node, NodeLink } from '../types/nodes';
import { useCanvasDrop } from '../hooks/useCanvasDrop';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { createGridPattern, createBackground, CANVAS_CONSTANTS } from '../services/canvasUtils';

interface CanvasProps {
  nodes: Node[];
  links: NodeLink[];
  onNodesChange: (nodes: Node[]) => void;
  onLinksChange: (links: NodeLink[]) => void;
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
          
          // Example SVG icon (placeholder)
          iconContainer.append('path')
            .attr('d', 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5')
            .attr('stroke', 'currentColor')
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
          
          const textElement = textNode.append('text')
            .text(d.content)
            .attr('x', 10)
            .attr('y', 20);
          
          // Calculate bbox and create background
          const bbox = (textElement.node() as SVGTextElement).getBBox();
          textNode.insert('rect', 'text')
            .attr('width', bbox.width + 20)
            .attr('height', bbox.height + 20)
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

    // Create links
    const linkGroup = svg.append('g')
      .attr('class', 'links');

    const linkElements = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', styles.link)
      .attr('x1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode?.x || 0;
      })
      .attr('y1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode?.y || 0;
      })
      .attr('x2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode?.x || 0;
      })
      .attr('y2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode?.y || 0;
      });

    // Render nodes
    const nodeGroups = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

    renderNode(nodeGroups);
    
    // Apply drag behavior
    nodeGroups.call(createDragBehavior());
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