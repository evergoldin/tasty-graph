import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ContentBlock } from '@/app/types/content';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: No NEXT_PUBLIC_ prefix
});

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

export async function POST(request: Request) {
  try {
    const { sourceText, contents } = await request.json();

    if (!sourceText || !contents) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const sourceEmbedding = await getEmbedding(sourceText);
    
    const contentWithSimilarity = await Promise.all(
      contents.map(async (content: ContentBlock) => {
        const contentEmbedding = await getEmbedding(content.content);
        const similarity = cosineSimilarity(sourceEmbedding, contentEmbedding);
        return {
          ...content,
          similarity
        };
      })
    );

    const similarContents = contentWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    return NextResponse.json(similarContents);
    
  } catch (error) {
    console.error('Error in embeddings route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 