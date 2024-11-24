import { useCallback, useEffect, useRef } from 'react';
import { Node, useReactFlow, Edge } from 'reactflow';

const REPULSION = 5000; // Force between nodes
const SPRING_LENGTH = 200; // Natural length of edges
const SPRING_STRENGTH = 0.3;
const DAMPING = 0.8;
const TIME_STEP = 0.5;
const CENTER_FORCE = 0.05; // Force pulling to center
const CENTER_X = window.innerWidth / 2;
const CENTER_Y = window.innerHeight / 2;

type Vector = { x: number; y: number };
type NodeWithPhysics = Node & {
  velocity: Vector;
  force: Vector;
  isAttracted?: boolean; // New property to determine behavior
};

export function usePhysicsGraph() {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const animationFrame = useRef<number>();

  // Initialize nodes with random behavior
  const initializeNodes = useCallback((nodes: NodeWithPhysics[]) => {
    nodes.forEach(node => {
      if (typeof node.isAttracted === 'undefined') {
        // Randomly assign behavior (50% chance for each)
        node.isAttracted = Math.random() < 0.5;
      }
    });
    return nodes;
  }, []);

  const calculateForces = useCallback(() => {
    let nodes = getNodes() as NodeWithPhysics[];
    nodes = initializeNodes(nodes);
    const edges = getEdges();

    // Initialize forces
    nodes.forEach(node => {
      node.force = { x: 0, y: 0 };
      node.velocity = node.velocity || { x: 0, y: 0 };

      // Apply center force for attracted nodes
      if (node.isAttracted) {
        const dx = CENTER_X - node.position.x;
        const dy = CENTER_Y - node.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        node.force.x += dx * CENTER_FORCE;
        node.force.y += dy * CENTER_FORCE;
      } else {
        // Apply stronger repulsion for nodes meant to spread out
        for (const otherNode of nodes) {
          if (node === otherNode) continue;
          
          const dx = otherNode.position.x - node.position.x;
          const dy = otherNode.position.y - node.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const force = (REPULSION * 1.5) / (distance * distance); // Increased repulsion

          node.force.x -= (force * dx) / distance;
          node.force.y -= (force * dy) / distance;
        }
      }
    });

    // Calculate repulsion between nodes (weaker for attracted nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Reduce repulsion for attracted nodes
        const repulsionMultiplier = (nodes[i].isAttracted && nodes[j].isAttracted) ? 0.3 : 1;
        const force = (REPULSION * repulsionMultiplier) / (distance * distance);

        const fx = (force * dx) / distance;
        const fy = (force * dy) / distance;

        nodes[i].force.x -= fx;
        nodes[i].force.y -= fy;
        nodes[j].force.x += fx;
        nodes[j].force.y += fy;
      }
    }

    // Calculate spring forces from edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const displacement = distance - SPRING_LENGTH;

      const fx = (SPRING_STRENGTH * displacement * dx) / distance;
      const fy = (SPRING_STRENGTH * displacement * dy) / distance;

      source.force.x += fx;
      source.force.y += fy;
      target.force.x -= fx;
      target.force.y -= fy;
    });

    // Update velocities and positions
    nodes.forEach(node => {
      // Apply stronger damping to attracted nodes for more stability
      const nodeDamping = node.isAttracted ? DAMPING * 0.9 : DAMPING;
      
      node.velocity.x = (node.velocity.x + node.force.x * TIME_STEP) * nodeDamping;
      node.velocity.y = (node.velocity.y + node.force.y * TIME_STEP) * nodeDamping;

      node.position.x += node.velocity.x * TIME_STEP;
      node.position.y += node.velocity.y * TIME_STEP;
    });

    return nodes;
  }, [getNodes, getEdges, initializeNodes]);

  const updateGraph = useCallback(() => {
    const updatedNodes = calculateForces();
    setNodes(updatedNodes);
    animationFrame.current = requestAnimationFrame(updateGraph);
  }, [calculateForces, setNodes]);

  useEffect(() => {
    animationFrame.current = requestAnimationFrame(updateGraph);
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [updateGraph]);
} 