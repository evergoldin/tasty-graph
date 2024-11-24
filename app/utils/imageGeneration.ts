export async function generateSearchQuery(text: string): Promise<string> {
  const response = await fetch('/api/generate-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error('Failed to generate search query');
  }

  const { searchQuery } = await response.json();
  return searchQuery;
} 