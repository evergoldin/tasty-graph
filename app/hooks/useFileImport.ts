import { useState, useRef } from 'react';

interface ImportedContent {
    id: string;
    content: string;
    fileName: string;
    timestamp: Date;
}

export function useFileImport() {
    const [importedContents, setImportedContents] = useState<ImportedContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = (file: File): boolean => {
        const validTypes = ['.md', '.txt'];
        const maxSize = 5 * 1024 * 1024; 

        if (!validTypes.some(type => file.name.toLowerCase().endsWith(type))) {
            setError('Please select markdown or text files only');
            return false;
        }

        if (file.size > maxSize) {
            setError(`File "${file.name}" exceeds 5MB limit`);
            return false;
        }

        return true;
    };

    const handleFileImport = () => {
        setError(null);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.multiple = true;
        
        input.onchange = async (event) => {
            const files = Array.from((event.target as HTMLInputElement).files || []);
            if (files.length === 0) return;

            setIsLoading(true);
            const newContents: ImportedContent[] = [];

            try {
                for (const file of files) {
                    if (!validateFile(file)) continue;

                    const text = await file.text();
                    const newContent: ImportedContent = {
                        id: crypto.randomUUID(),
                        content: text,
                        fileName: file.name,
                        timestamp: new Date()
                    };
                    newContents.push(newContent);
                }
                
                if (newContents.length > 0) {
                    setImportedContents(prev => [...prev, ...newContents]);
                }
            } catch (err) {
                setError('Failed to read one or more files. Please try again.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        input.click();
    };

    return {
        importedContents,
        handleFileImport,
        isLoading,
        error
    };
} 