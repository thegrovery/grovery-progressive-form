// SerpAPI integration
export async function fetchSerpResults(query: string, options: Record<string, any> = {}): Promise<SerpData> {
  try {
    const apiKey = import.meta.env.SERP_API_KEY;
    
    if (!apiKey) {
      console.error("SerpAPI key is not configured");
      return { error: "API key missing" };
    }
    
    console.log(`Fetching SERP data for query: "${query}"`);
    
    // Clean up the query
    const cleanQuery = query.trim();
    
    // Build the search parameters
    const params = new URLSearchParams({
      q: cleanQuery,
      api_key: apiKey,
      engine: "google",
      gl: "us", // Google locale (country)
      hl: "en", // Language
      ...options
    });
    
    const url = `https://serpapi.com/search?${params}`;
    console.log("Calling SerpAPI:", url.replace(apiKey, "API_KEY_HIDDEN"));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI error (${response.status}):`, errorText);
      throw new Error(`SerpAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("SerpAPI response received with keys:", Object.keys(data));
    
    // If we have organic results, log the count
    if (data.organic_results) {
      console.log(`Found ${data.organic_results.length} organic results`);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching SERP data:", error);
    
    // If API fails, return mock data
    console.log("Using fallback SERP data");
    return getMockSerpData(query);
  }
}

// Fallback function to generate mock SERP data
function getMockSerpData(query: string) {
  const cleanQuery = query.toLowerCase().trim();
  
  return {
    search_metadata: {
      id: "mock_search_id",
      status: "Success",
      json_endpoint: "https://serpapi.com/searches/mock/json",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      google_url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
      raw_html_file: "https://serpapi.com/searches/mock/html",
      total_time_taken: 0.83
    },
    search_parameters: {
      engine: "google",
      q: cleanQuery,
      google_domain: "google.com",
      hl: "en",
      gl: "us",
      device: "desktop"
    },
    search_information: {
      organic_results_state: "Results for exact spelling",
      query_displayed: cleanQuery,
      total_results: 12400000,
      time_taken_displayed: 0.53
    },
    organic_results: [
      {
        position: 1,
        title: `Official ${cleanQuery} Website - Home`,
        link: `https://www.${cleanQuery.replace(/\s+/g, '')}.com/`,
        displayed_link: `https://www.${cleanQuery.replace(/\s+/g, '')}.com`,
        snippet: `${cleanQuery} is a leading brand in its industry. Discover our products, services, and the latest news about our company.`,
        snippet_highlighted_words: [cleanQuery],
        sitelinks: {
          inline: [
            {
              title: "Products",
              link: `https://www.${cleanQuery.replace(/\s+/g, '')}.com/products`
            },
            {
              title: "About Us",
              link: `https://www.${cleanQuery.replace(/\s+/g, '')}.com/about`
            }
          ]
        }
      },
      {
        position: 2,
        title: `${cleanQuery} - Wikipedia`,
        link: `https://en.wikipedia.org/wiki/${cleanQuery.replace(/\s+/g, '_')}`,
        displayed_link: `https://en.wikipedia.org › wiki › ${cleanQuery.replace(/\s+/g, '_')}`,
        snippet: `${cleanQuery} is a company founded in ${2000 - (cleanQuery.length % 20)} that specializes in innovative solutions for consumers and businesses alike.`,
        snippet_highlighted_words: [cleanQuery]
      },
      {
        position: 3,
        title: `${cleanQuery} Reviews | Customer Service Reviews of ${cleanQuery}`,
        link: `https://www.trustpilot.com/review/${cleanQuery.replace(/\s+/g, '')}.com`,
        displayed_link: `https://www.trustpilot.com › review › ${cleanQuery.replace(/\s+/g, '')}`,
        snippet: `See what customers say about ${cleanQuery}. Read genuine customer reviews and ratings to make an informed decision.`,
        snippet_highlighted_words: [cleanQuery]
      }
    ],
    related_searches: [
      {
        query: `${cleanQuery} products`,
        link: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}+products`
      },
      {
        query: `${cleanQuery} reviews`,
        link: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}+reviews`
      },
      {
        query: `${cleanQuery} vs competitors`,
        link: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}+vs+competitors`
      }
    ],
    related_questions: [
      {
        question: `What does ${cleanQuery} do?`,
        snippet: `${cleanQuery} is a company that provides innovative solutions in the ${cleanQuery.length % 2 === 0 ? 'technology' : 'consumer goods'} sector.`
      },
      {
        question: `When was ${cleanQuery} founded?`,
        snippet: `${cleanQuery} was founded in ${2000 - (cleanQuery.length % 20)} by entrepreneurs looking to disrupt the industry.`
      }
    ],
    isMockData: true
  };
}

interface SerpData {
  organic_results?: any[];
  knowledge_graph?: any;
  related_questions?: any[];
  error?: string;
}

export type { SerpData }; 