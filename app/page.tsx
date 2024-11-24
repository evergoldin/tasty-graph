"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { ContentBlock } from './types/content';

export default function Home() {
  const [canvasNodes, setCanvasNodes] = useState<ContentBlock[]>([]);

  const handleDragContent = (content: ContentBlock) => {
    if (!canvasNodes.find(node => node.id === content.id)) {
      setCanvasNodes((prev) => [...prev, content]);
    }
  };

  return (
    <main className={styles.main}>
      <Sidebar onDragContent={handleDragContent} />
      <Canvas nodes={canvasNodes} onNodesChange={setCanvasNodes} />
    </main>
  );
}
