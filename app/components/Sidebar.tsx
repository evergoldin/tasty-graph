"use client";

import styles from './Sidebar.module.css';

// Import from Markdown File Button

export default function Sidebar() {
    const handleFileImport = () => {
        console.log('Import from Markdown File');
    }

    return (
        <div className={styles.sidebar}>
            {/* Add your sidebar content here */}
            <button onClick={handleFileImport}>Import from Markdown File</button>
        </div>
    );
} 