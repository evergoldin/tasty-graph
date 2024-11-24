"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { IconNode, Node, NodeLink, TextNode } from './types/nodes';
import { ContentBlock } from './types/content';

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<NodeLink[]>([]);

  const handleDragContent = (content: ContentBlock) => {
    const iconNode: IconNode = {
      id: crypto.randomUUID(),
      type: 'icon',
      title: content.fileName,
      iconPath: 'M12 2L2 7l10 5 10-5-10-5z', // Default icon path
      x: 100,
      y: 100
    };

    const textNode: TextNode = {
      id: crypto.randomUUID(),
      type: 'text',
      content: content.content,
      x: 250,
      y: 100
    };

    const link: NodeLink = {
      source: iconNode.id,
      target: textNode.id
    };

    setNodes(prev => [...prev, iconNode, textNode]);
    setLinks(prev => [...prev, link]);
  };

  return (
    <main className={styles.main}>
      <Sidebar onDragContent={handleDragContent} />
      <Canvas 
        nodes={nodes} 
        links={links}
        onNodesChange={setNodes}
        onLinksChange={setLinks}
      />
    </main>
  );
}
