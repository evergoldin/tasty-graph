import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes || !Array.isArray(notes)) {
      return NextResponse.json({ error: 'Invalid notes data' }, { status: 400 });
    }

    const processedNotes = await Promise.all(
      notes.map(async (note) => {
        try {
          const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: note.text,
          });
          return {
            ...note,
            embedding: response.data[0].embedding,
          };
        } catch (error) {
          console.error(`Error generating embedding for note ${note.id}:`, error);
          return note;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      notes: processedNotes,
      message: 'Embeddings generated successfully' 
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
} 