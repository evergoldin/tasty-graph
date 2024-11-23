import { createApi } from 'unsplash-js';
import { NextResponse } from 'next/server';

// Create the Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    console.log('Searching Unsplash for:', query);

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      throw new Error('UNSPLASH_ACCESS_KEY is not configured');
    }

    const result = await unsplash.search.getPhotos({
      query,
      perPage: 1,
      orientation: 'landscape'
    });

    if (result.errors) {
      throw new Error(result.errors[0]);
    }

    const photos = result.response?.results;
    
    if (!photos || photos.length === 0) {
      return NextResponse.json({ 
        error: 'No images found for this query' 
      }, { status: 404 });
    }

    const imageUrl = photos[0].urls.regular;
    
    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Image URL not found in response' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      imageUrl,
      credit: {
        name: photos[0].user.name,
        username: photos[0].user.username,
        link: `https://unsplash.com/@${photos[0].user.username}`
      }
    });
  } catch (error) {
    console.error('Error searching image:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error searching image' 
    }, { status: 500 });
  }
} 