import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { search } = await request.json();
    
    // Start the Pinterest crawler run
    const response = await fetch(`https://api.apify.com/v2/acts/apify~pinterest-crawler/runs?token=${process.env.APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{
          url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(search)}`
        }],
        maxPins: 2,
      }),
    });

    const { id: runId } = await response.json();
    console.log('Run started with ID:', runId);

    // Wait for the run to complete
    let runFinished = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!runFinished && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~pinterest-crawler/runs/${runId}?token=${process.env.APIFY_TOKEN}`
      );
      const statusData = await statusResponse.json();
      console.log('Run status:', statusData.status);

      if (statusData.status === 'SUCCEEDED') {
        runFinished = true;
      }
      attempts++;
    }

    if (!runFinished) {
      throw new Error('Run did not complete in time');
    }

    // Now get the dataset items
    const datasetUrl = `https://api.apify.com/v2/acts/apify~pinterest-crawler/runs/${runId}/dataset/items?token=${process.env.APIFY_TOKEN}`;
    const dataResponse = await fetch(datasetUrl);
    const pins = await dataResponse.json();
    
    console.log('Received pins:', pins);

    if (pins && pins.length > 0) {
      // Get the first pin URL
      const pinUrl = pins[0].url;
      
      // Start a new run for the pin crawler
      const pinResponse = await fetch(`https://api.apify.com/v2/acts/apify~pinterest-pin-crawler/runs?token=${process.env.APIFY_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [{ url: pinUrl }],
        }),
      });
      
      const { id: pinRunId } = await pinResponse.json();
      
      // Wait for pin crawler run to complete
      runFinished = false;
      attempts = 0;

      while (!runFinished && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pinStatusResponse = await fetch(
          `https://api.apify.com/v2/acts/apify~pinterest-pin-crawler/runs/${pinRunId}?token=${process.env.APIFY_TOKEN}`
        );
        const pinStatusData = await pinStatusResponse.json();
        console.log('Pin run status:', pinStatusData.status);

        if (pinStatusData.status === 'SUCCEEDED') {
          runFinished = true;
        }
        attempts++;
      }

      if (!runFinished) {
        throw new Error('Pin run did not complete in time');
      }

      // Get the pin data
      const pinDatasetUrl = `https://api.apify.com/v2/acts/apify~pinterest-pin-crawler/runs/${pinRunId}/dataset/items?token=${process.env.APIFY_TOKEN}`;
      const pinDataResponse = await fetch(pinDatasetUrl);
      const pinData = await pinDataResponse.json();
      
      console.log('Pin data:', pinData);

      if (pinData && pinData.length > 0 && pinData[0].images) {
        const imageUrl = pinData[0].images.orig || pinData[0].images.x1000 || pinData[0].images.x750;
        if (imageUrl) {
          return NextResponse.json({ imageUrl });
        }
      }
    }

    throw new Error('Failed to get image URL');
  } catch (error) {
    console.error('Pinterest API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Pinterest images' }, { status: 500 });
  }
} 