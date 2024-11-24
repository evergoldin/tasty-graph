import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Convert the following text into a concise Pinterest search query that would find relevant images. Keep it under 5 words."
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const searchQuery = response.choices[0].message.content || '';
    return Response.json({ searchQuery });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return Response.json({ error: 'Failed to generate search query' }, { status: 500 });
  }
} 