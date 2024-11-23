import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates image search queries based on text. Generate 3 different search queries that would find relevant images."
        },
        {
          role: "user",
          content: `Generate 3 different image search queries for this text: "${text}"`
        }
      ],
      model: "gpt-3.5-turbo",
    });

    const queries = completion.choices[0].message.content
      ?.split('\n')
      .filter(q => q.trim())
      .map(q => q.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    return NextResponse.json({ searchQueries: queries });
  } catch (error) {
    console.error('Error generating query:', error);
    return NextResponse.json({ error: 'Failed to generate search queries' }, { status: 500 });
  }
} 