import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for storing embeddings
let embeddingsCache: { [key: string]: number[] } = {};

async function getEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(req: Request) {
  try {
    const { text, notes } = await req.json();

    // First, filter out any notes that exactly match the input text
    const filteredNotes = notes.filter((note: { text: string; }) => 
      note.text.trim() !== text.trim()
    );

    // Get embedding for the clicked text
    const targetEmbedding = await getEmbedding(text);

    // Get embeddings for filtered notes
    const noteEmbeddings = await Promise.all(
      filteredNotes.map(async (note: { id: string; text: string }) => {
        if (!embeddingsCache[note.id]) {
          embeddingsCache[note.id] = await getEmbedding(note.text);
        }
        return {
          ...note,
          embedding: embeddingsCache[note.id],
        };
      })
    );

    // Calculate similarities and sort
    const similarNotes = noteEmbeddings
      .map(note => {
        const similarity = cosineSimilarity(targetEmbedding, note.embedding);
        return {
          ...note,
          similarity: similarity,
        };
      })
      .filter(note => note.similarity < 0.9999) // Filter out near-perfect matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3) // Get top 3 similar notes
      .map(({ id, text, similarity }) => ({
        id,
        text,
        preview: text.substring(0, 100) + '...',
        similarity,
      }));

    return NextResponse.json({ similarNotes });
  } catch (error) {
    console.error('Error in vector search:', error);
    return NextResponse.json({ error: 'Failed to process vector search' }, { status: 500 });
  }
} 