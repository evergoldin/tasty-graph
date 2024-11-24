import { ContentBlock } from '../types/content';

export interface SimilarContent extends ContentBlock {
  similarity: number;
}

export async function findSimilarContents(
  sourceText: string, 
  contents: ContentBlock[],
  limit: number = 3
): Promise<SimilarContent[]> {
  try {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceText,
        contents
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch similar contents');
    }

    const similarContents: SimilarContent[] = await response.json();
    return similarContents;
      
  } catch (error) {
    console.error('Error finding similar contents:', error);
    return [];
  }
} 