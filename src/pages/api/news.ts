import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const brandName = searchParams.get('brandName');
    
    if (!brandName) {
      return new Response(JSON.stringify({ error: 'Brand name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const NEWS_API_KEY = import.meta.env.NEWS_API_KEY;
    const encodedBrandName = encodeURIComponent(brandName);
    
    // Get news from the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const fromDate = lastMonth.toISOString().split('T')[0];

    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q="${encodedBrandName}"&` +
      `from=${fromDate}&` +
      `sortBy=relevancy&` +
      `language=en&` +
      `apiKey=${NEWS_API_KEY}`
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('News API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch news data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 