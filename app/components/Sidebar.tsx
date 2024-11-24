"use client";

import styles from './Sidebar.module.css';
import { DragEvent } from 'react';
import { ContentBlock } from '../types/content';

interface SidebarProps {
  onDragContent: (content: ContentBlock) => void;
  importedContents: ContentBlock[];
  handleFileImport: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function Sidebar({ 
  onDragContent, 
  importedContents, 
  handleFileImport, 
  isLoading, 
  error 
}: SidebarProps) {
    const handleDragStart = (e: DragEvent<HTMLDivElement>, content: ContentBlock) => {
        e.dataTransfer.setData('application/json', JSON.stringify(content));
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.controls}>
                <button 
                    onClick={handleFileImport}
                    disabled={isLoading}
                    className={styles.importButton}
                >
                    {isLoading ? 'Importing...' : 'Import from Markdown File'}
                </button>
                
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}
            </div>
            
            <div className={styles.importedContent}>
                {importedContents.map((content) => (
                    <div 
                        key={content.id} 
                        className={styles.contentBlock}
                        draggable
                        onDragStart={(e) => handleDragStart(e, content)}
                    >
                        <div className={styles.contentHeader}>
                            <h3>{content.fileName}</h3>
                        </div>
                        <div className={styles.contentText}>
                            {content.content}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
} 