import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function getEmbeddingWithRetry(text: string, retries = 0): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getEmbeddingWithRetry(text, retries + 1);
    }
    throw new Error('Failed to get embedding after multiple retries');
  }
}

interface NoteWithEmbedding {
  id: string;
  text: string;
  embedding?: number[];
}

export async function POST(req: Request) {
  try {
    const { text, notes, useStoredEmbeddings } = await req.json();

    if (!text || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let queryEmbedding;
    try {
      queryEmbedding = await getEmbeddingWithRetry(text);
    } catch (error) {
      console.error('Error getting embedding:', error);
      return NextResponse.json(
        { error: 'Failed to process query. Please try again later.' },
        { status: 503 }
      );
    }

    let processedNotes: NoteWithEmbedding[];
    
    if (useStoredEmbeddings) {
      // Use the pre-generated embeddings directly
      processedNotes = notes.filter((note: NoteWithEmbedding) => note.embedding !== undefined);
    } else {
      // Generate embeddings on the fly
      const noteEmbeddingPromises = notes.map(async (note: NoteWithEmbedding) => {
        try {
          const embedding = await getEmbeddingWithRetry(note.text);
          return {
            ...note,
            embedding
          };
        } catch (error) {
          console.error(`Error processing note ${note.id}:`, error);
          return null;
        }
      });

      processedNotes = (await Promise.all(noteEmbeddingPromises))
        .filter((note): note is NoteWithEmbedding => note !== null);
    }

    // Calculate similarities
    const similarNotes = processedNotes
      .map((note) => {
        const similarity = cosineSimilarity(queryEmbedding, note.embedding!);
        return {
          id: note.id,
          text: note.text,
          preview: note.text.substring(0, 100) + '...',
          similarity
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    return NextResponse.json({ similarNotes });
  } catch (error) {
    console.error('Error in vector search:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
} 