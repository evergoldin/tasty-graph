import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!
});

export async function getUnsplashImage(query: string) {
  const result = await unsplash.search.getPhotos({
    query,
    orientation: 'landscape',
    perPage: 1
  });

  if (result.errors) {
    throw new Error('Failed to fetch image from Unsplash');
  }

  return result.response.results[0].urls.regular;
} 