"use client";

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './Canvas.module.css';
import { ContentBlock } from '../types/content';
import { useCanvasDrop } from '../hooks/useCanvasDrop';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { createGridPattern, createBackground, CANVAS_CONSTANTS } from '../services/canvasUtils';

interface CanvasProps {
  nodes: ContentBlock[];
  onNodesChange: (nodes: ContentBlock[]) => void;
}

export default function Canvas({ nodes, onNodesChange }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createDragBehavior = useNodeDrag(nodes, onNodesChange, styles);
  const { handleDragOver, handleDrop } = useCanvasDrop(nodes, onNodesChange);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Setup canvas
    createGridPattern(svg);
    createBackground(svg, styles);

    // Create a container for all nodes
    const nodesContainer = svg.append("g").attr("class", "nodes-container");

    // Render nodes
    const nodeGroups = nodesContainer
      .selectAll<SVGGElement, ContentBlock>("g.node")
      .data(nodes, d => d.id)
      .join(
        enter => {
          const nodeGroup = enter.append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x || 100}, ${d.y || 100})`);

          // Create a group for the node content
          const contentGroup = nodeGroup.append("g")
            .attr("class", "node-content");

          // Add rectangles for nodes
          contentGroup.append("rect")
            .attr("width", CANVAS_CONSTANTS.NODE_WIDTH)
            .attr("height", CANVAS_CONSTANTS.NODE_HEIGHT)
            .attr("rx", CANVAS_CONSTANTS.BORDER_RADIUS)
            .attr("ry", CANVAS_CONSTANTS.BORDER_RADIUS)
            .attr("class", styles.node);

          // Add text to nodes
          contentGroup.append("text")
            .attr("x", CANVAS_CONSTANTS.TEXT_PADDING)
            .attr("y", 25)
            .text(d => d.fileName)
            .attr("class", styles.nodeText);

          // Add content text (truncated)
          contentGroup.append("text")
            .attr("x", CANVAS_CONSTANTS.TEXT_PADDING)
            .attr("y", 50)
            .text(d => `${d.content.substring(0, CANVAS_CONSTANTS.CONTENT_MAX_LENGTH)}...`)
            .attr("class", styles.nodeContent);

          return nodeGroup;
        },
        update => update.attr("transform", d => `translate(${d.x || 100}, ${d.y || 100})`),
        exit => exit.remove()
      );

    // Apply drag behavior
    nodeGroups.call(createDragBehavior());

  }, [nodes, createDragBehavior]);

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