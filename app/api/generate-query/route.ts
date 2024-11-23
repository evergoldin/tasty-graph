import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating Unsplash-style image search queries that capture concepts through visual metaphors and direct representations. Focus on practical, searchable terms that would yield high-quality stock photography results while maintaining conceptual relevance."
        },
        {
          role: "user",
          content: `Create a practical image search query for Unsplash based on this text: "${text}".
Consider these approaches:
1. Direct visual representation if the concept is tangible
2. Common metaphors that photographers would capture
3. Related objects or scenes that evoke the concept
4. Natural or architectural elements that reflect the theme
5. Minimal, clean compositions that photographers favor

Make the query realistic and searchable on Unsplash (2-5 words).
Use popular photography subjects and styles.
Prioritize connection to the original concept.`
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const searchQuery = completion.choices[0].message.content?.trim() || '';
    
    return NextResponse.json({ searchQuery });
  } catch (error) {
    console.error('Error generating query:', error);
    return NextResponse.json({ error: 'Error generating query' }, { status: 500 });
  }
} 