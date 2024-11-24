"use client";

import { useFileImport } from '../hooks/useFileImport';
import styles from './Sidebar.module.css';
import { DragEvent } from 'react';

interface SidebarProps {
  onDragContent: (content: any) => void;
}

export default function Sidebar({ onDragContent }: SidebarProps) {
    const {
        importedContents,
        handleFileImport,
        isLoading,
        error
    } = useFileImport();

    const handleDragStart = (e: DragEvent<HTMLDivElement>, content: any) => {
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
                            <span>{content.timestamp.toLocaleDateString()}</span>
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