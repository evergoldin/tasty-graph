import { useCallback, useEffect, useState } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

// Simple 2D vector physics
type Vector = { x: number; y: number };
type Spring = { position: Vector; velocity: Vector; target: Vector };

const SPRING_STRENGTH = 0.1;
const DAMPING = 0.8;
const MASS = 1.0;

export function PhysicsEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [spring, setSpring] = useState<Spring>({
    position: { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 },
    velocity: { x: 0, y: 0 },
    target: { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 },
  });

  const updateSpring = useCallback(() => {
    setSpring((currentSpring) => {
      const target = {
        x: (sourceX + targetX) / 2,
        y: (sourceY + targetY) / 2,
      };

      // Calculate spring force
      const fx = (target.x - currentSpring.position.x) * SPRING_STRENGTH;
      const fy = (target.y - currentSpring.position.y) * SPRING_STRENGTH;

      // Update velocity with spring force and damping
      const vx = (currentSpring.velocity.x + fx / MASS) * DAMPING;
      const vy = (currentSpring.velocity.y + fy / MASS) * DAMPING;

      // Update position
      const px = currentSpring.position.x + vx;
      const py = currentSpring.position.y + vy;

      return {
        position: { x: px, y: py },
        velocity: { x: vx, y: vy },
        target,
      };
    });
  }, [sourceX, sourceY, targetX, targetY]);

  useEffect(() => {
    const interval = setInterval(updateSpring, 16); // 60fps
    return () => clearInterval(interval);
  }, [updateSpring]);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: { x: sourceX, y: sourceY },
    targetPosition: { x: targetX, y: targetY },
    curvature: 0.25,
    controlX: spring.position.x,
    controlY: spring.position.y,
  });

  return (
    <path
      id={id}
      className={styles.physicsEdge}
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
} 