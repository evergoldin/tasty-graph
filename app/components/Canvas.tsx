"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { forceSimulation, forceLink } from 'd3';
import styles from './Canvas.module.css';
import { IconNode, ImageNode, Node, NodeLink, TextNode } from '../types/nodes';
import { useCanvasDrop } from '../hooks/useCanvasDrop';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { createGridPattern, createBackground, CANVAS_CONSTANTS } from '../services/canvasUtils';
import ContentPopup from './ContentPopup';
import { ContentBlock } from '../types/content';
import { findSimilarContents, SimilarContent } from '../utils/embeddings';
import { getUnsplashImage } from '../utils/unsplash';

interface CanvasProps {
  nodes: Node[];
  links: NodeLink[];
  onNodesChange: (nodes: Node[]) => void;
  onLinksChange: (links: NodeLink[] | ((prevLinks: NodeLink[]) => NodeLink[])) => void;
  sidebarContents: ContentBlock[];
}

export default function Canvas({ nodes, links, onNodesChange, onLinksChange, sidebarContents }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createDragBehavior = useNodeDrag(nodes, onNodesChange, styles);
  const { handleDragOver, handleDrop } = useCanvasDrop(nodes, onNodesChange, onLinksChange);

  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    contents: SimilarContent[] | null;
    isLoading: boolean;
    sourceNodeId: string | null;
  } | null>(null);

  const handleCanvasClick = useCallback(() => {
    setPopupState(null);
  }, []);

  const renderNode = (nodeGroup: d3.Selection<SVGGElement, Node, any, any>) => {
    nodeGroup.each(function(d) {
      const group = d3.select(this);
      
      switch(d.type) {
        case 'icon':
          // Icon container
          const iconContainer = group.append('g')
            .attr('class', 'icon-container');
          
          // Invisible circle for link targeting
          iconContainer.append('circle')
            .attr('r', 24)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('fill', 'transparent')
            .attr('stroke', 'none');
          
          // SVG icon
          iconContainer.append('path')
            .attr('d', d.iconPath)
            .attr('transform', 'translate(-20, -20) scale(0.833)')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', '4')
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'var(--background-primary)');
          
          // Title text
          iconContainer.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 40)
            .attr('class', styles.iconTitle)
            .text(function(d: any) {
              const iconNode = d as IconNode;
              return iconNode.title.replace(/\.(md|txt)$/, '').toUpperCase();
            })
            .call(wrap, 160); // Wrap text at 160px
          break;

        case 'text':
          const textNode = group.append('g')
            .attr('class', 'text-container')
            .on('click', async function(this: SVGGElement, event: any, d: unknown) {
              event.stopPropagation();
              if (!event.defaultPrevented && (d as Node).type === 'text') {
                const rect = (event.target as SVGElement).getBoundingClientRect();
              
                // Show popup immediately with loading state
                setPopupState({
                  isOpen: true,
                  x: rect.left,
                  y: rect.top,
                  contents: null,
                  isLoading: true,
                  sourceNodeId: (d as Node).id
                });
                
                // Fetch similar contents
                const similarContents = await findSimilarContents((d as TextNode).content, sidebarContents);
                
                // Update popup with contents
                setPopupState(prev => prev ? {
                  ...prev,
                  contents: similarContents,
                  isLoading: false
                } : null);
              }
            });

          // Create background rectangle first
          const backgroundRect = textNode.append('rect')
            .attr('rx', 5)
            .attr('class', styles.textNode);
          
          // Create text element
          const textElement = textNode.append('text')
            .attr('class', styles.nodeText)
            .attr('x', 16)
            .attr('y', 24);
          
          const maxWidth = 268;
          let totalHeight = 24;
          
          // Split content into words
          const words = d.content.split(/\s+/);
          let line: string[] = [];
          let tspan = textElement.append('tspan')
            .attr('x', 16)
            .attr('dy', 0);
          
          // Process each word
          words.forEach((word, i) => {
            const testLine = [...line, word];
            tspan.text(testLine.join(' '));
            
            if ((tspan.node()?.getComputedTextLength() || 0) > maxWidth) {
              if (line.length > 0) {
                // Set the current line
                tspan.text(line.join(' '));
                // Start new line
                line = [word];
                totalHeight += 20; // Increment height for new line
                tspan = textElement.append('tspan')
                  .attr('x', 16)
                  .attr('dy', '1.2em')
                  .text(word);
              } else {
                // Handle case where single word is too long
                line = [word];
                tspan.text(word);
              }
            } else {
              line = testLine;
            }
            
            // Handle last line
            if (i === words.length - 1) {
              tspan.text(line.join(' '));
            }
          });
          
          // Calculate final height and set background rectangle size
          totalHeight += 24;
          backgroundRect
            .attr('width', 300)
            .attr('height', totalHeight);
          
          // Add image generation button container AFTER the text content
          const buttonContainer = textNode.append('g')
            .attr('class', 'image-button')
            .style('opacity', 0)
            .attr('transform', `translate(310, ${totalHeight / 2})`) // Center vertically
            .on('click', async function(event: any, d: any) {
              event.stopPropagation();
              
              try {
                // Get search query from OpenAI
                const queryResponse = await fetch('/api/image-query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: d.content })
                });
                const { query } = await queryResponse.json();
                
                // Get image from Unsplash
                const imageUrl = await getUnsplashImage(query);
                
                // Create new image node
                const newNode: ImageNode = {
                  id: crypto.randomUUID(),
                  type: 'image',
                  imageUrl,
                  width: 300,
                  height: 200,
                  x: d.x + 350,
                  y: d.y
                };
                
                onNodesChange([...nodes, newNode]);
              } catch (error) {
                console.error('Failed to generate image:', error);
              }
            });

          // Add button circle
          buttonContainer.append('circle')
            .attr('r', 15)
            .attr('fill', 'var(--background-secondary)')
            .attr('stroke', 'var(--border-color)')
            .attr('stroke-width', 1);

          // Add image icon
          buttonContainer.append('path')
            .attr('d', 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z')
            .attr('transform', 'translate(-8, -8) scale(0.7)')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('fill', 'none');

          // Show/hide button on hover
          textNode.on('mouseenter', function() {
            d3.select(this).select('.image-button')
              .transition()
              .duration(200)
              .style('opacity', 1);
          })
          .on('mouseleave', function() {
            d3.select(this).select('.image-button')
              .transition()
              .duration(200)
              .style('opacity', 0);
          });
          
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
      .attr('data-id', d => d.id)
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
          if (!target) return 0;
          
          // For text nodes, calculate center point
          if (target.type === 'text') {
            const textNode = d3.select(`g.node[data-id="${target.id}"] rect`).node() as SVGRectElement;
            const bbox = textNode?.getBoundingClientRect();
            return (target.x || 0) + (bbox?.width || 0) / 2;
          }
          return target.x || 0;
        })
        .attr('y2', d => {
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target);
          if (!target) return 0;
          
          // For text nodes, calculate center point
          if (target.type === 'text') {
            const textNode = d3.select(`g.node[data-id="${target.id}"] rect`).node() as SVGRectElement;
            const bbox = textNode?.getBoundingClientRect();
            return (target.y || 0) + (bbox?.height || 0) / 2;
          }
          return target.y || 0;
        });

      nodeGroups.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    svg.on('click', handleCanvasClick);
  }, [nodes, links, createDragBehavior]);

  const handleNodeClick = useCallback((event: MouseEvent, node: Node) => {
    if (node.type === 'text') {
      event.stopPropagation();
      findSimilarContents(node.content, sidebarContents).then(similarContents => {
        setPopupState({
          isOpen: true,
          x: event.clientX,
          y: event.clientY,
          contents: similarContents,
          isLoading: false,
          sourceNodeId: node.id
        });
      });
    }
  }, [sidebarContents]);

  return (
    <div 
      ref={containerRef}
      className={styles.canvas}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, containerRef)}
      onClick={handleCanvasClick}
    >
      <svg ref={svgRef} width="100%" height="100%" />
      {popupState && (
        <ContentPopup
          x={popupState.x}
          y={popupState.y}
          contents={popupState.contents}
          isLoading={popupState.isLoading}
          onSelect={(content) => {
            const newNode: TextNode = {
              id: crypto.randomUUID(),
              type: 'text',
              content: content.content,
              x: popupState.x + 100,
              y: popupState.y
            };

            // Create a new link between the original node and the new node
            const newLink: NodeLink = {
              source: popupState.sourceNodeId!, // We'll add this to the state
              target: newNode.id
            };

            onNodesChange([...nodes, newNode]);
            onLinksChange(prevLinks => [...prevLinks, newLink]);
            setPopupState(null);
          }}
        />
      )}
    </div>
  );
} 

// Add the wrap function
function wrap(text: d3.Selection<SVGTextElement, any, any, any>, width: number) {
  text.each(function() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
    const y = text.attr("y");
    const dy = 0;
    let tspan = text.text(null).append("tspan")
      .attr("x", 0)
      .attr("y", y)
      .attr("dy", dy + "em");

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if ((tspan.node()?.getComputedTextLength() || 0) > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
} 