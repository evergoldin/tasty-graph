import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Convert the following text into a short, descriptive image search query suitable for Unsplash. Keep it concise and visual."
      }, {
        role: "user",
        content: text
      }],
      max_tokens: 50
    });

    const searchQuery = response.choices[0].message.content;
    return NextResponse.json({ query: searchQuery });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate query' }, { status: 500 });
  }
} 