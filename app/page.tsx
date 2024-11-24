"use client";

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { IconNode, Node, NodeLink, TextNode } from './types/nodes';
import { ContentBlock } from './types/content';
import { useFileImport } from './hooks/useFileImport';

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<NodeLink[]>([]);
  const { importedContents, handleFileImport, handleKindleImport, isLoading, error } = useFileImport();

  const handleDragContent = (content: ContentBlock) => {
    const iconNode: IconNode = {
      id: crypto.randomUUID(),
      type: 'icon',
      title: content.fileName,
      iconPath: 'M12 2L2 7l10 5 10-5-10-5z',
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
      <Sidebar 
        onDragContent={handleDragContent}
        importedContents={importedContents}
        handleFileImport={handleFileImport}
        handleKindleImport={handleKindleImport}
        isLoading={isLoading}
        error={error}
      />
      <Canvas 
        nodes={nodes} 
        links={links}
        onNodesChange={setNodes}
        onLinksChange={setLinks}
        sidebarContents={importedContents}
      />
    </main>
  );
}
