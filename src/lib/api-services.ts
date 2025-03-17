// src/lib/api-services.ts
export async function getGoogleTrendsData(brandName: string) {
    // Implementation using Google Trends API
  }
  
  export async function getMozData(domain: string) {
    try {
      const mozApiKey = import.meta.env.MOZ_API_KEY;
      
      // If you don't have a Moz API key, return mock data for testing
      if (!mozApiKey) {
        console.warn('MOZ_API_KEY not found, returning mock data');
        return {
          domainAuthority: Math.floor(Math.random() * 100),
          pageAuthority: Math.floor(Math.random() * 100),
          links: Math.floor(Math.random() * 1000)
        };
      }
      
      const url = `https://moz.com/api/v2/url_metrics?site=${encodeURIComponent(domain)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${mozApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Moz API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        domainAuthority: data.domain_authority || 0,
        pageAuthority: data.page_authority || 0,
        links: data.linking_domains || 0
      };
    } catch (error) {
      console.error('Error fetching Moz data:', error);
      return {
        domainAuthority: 0,
        pageAuthority: 0,
        links: 0
      };
    }
  }
  
  export async function getNewsData(brandName: string) {
    try {
      const newsApiKey = import.meta.env.NEWS_API_KEY;
      const encodedBrand = encodeURIComponent(brandName);
      
      // NewsAPI.org implementation
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodedBrand}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${newsApiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate basic sentiment from titles and descriptions
      const articles = data.articles.map(article => {
        return {
          ...article,
          // Add simple positive/negative keyword analysis 
          // This is a placeholder for more sophisticated sentiment analysis
          sentiment: calculateSimpleSentiment(article.title + " " + article.description)
        };
      });
      
      return {
        articles,
        totalResults: data.totalResults,
        sentimentSummary: summarizeSentiment(articles),
        sourceDiversity: calculateSourceDiversity(articles)
      };
    } catch (error) {
      console.error("Error fetching news data:", error);
      return {
        articles: [],
        totalResults: 0,
        sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
        sourceDiversity: 0,
        error: error.message
      };
    }
  }
  
  export async function getSerpData(brandName: string) {
    try {
      const serpApiKey = import.meta.env.SERP_API_KEY;
      const encodedBrand = encodeURIComponent(brandName);
      
      // SerpAPI implementation
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google&q=${encodedBrand}&api_key=${serpApiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract and structure relevant SERP information
      const serpData = {
        organicResults: data.organic_results || [],
        knowledgeGraph: data.knowledge_graph || null,
        relatedSearches: data.related_searches || [],
        rankingPosition: findBrandPosition(data.organic_results, brandName),
        hasKnowledgeGraph: !!data.knowledge_graph,
        topCompetitors: extractCompetitors(data),
        serp_features: {
          hasMap: !!data.local_results,
          hasNews: !!data.news_results,
          hasImages: !!data.images_results,
          hasVideos: !!data.videos_results
        }
      };
      
      // Add domain authority from Moz if a domain is detected
      let domainAuthority = 0;
      if (serpData && serpData.organicResults && serpData.organicResults.length > 0) {
        // Extract domain from first organic result
        const firstResult = serpData.organicResults[0];
        if (firstResult && firstResult.link) {
          try {
            const domain = new URL(firstResult.link).hostname;
            const mozData = await getMozData(domain);
            domainAuthority = mozData.domainAuthority;
            
            // Add domain authority to the SERP data
            serpData.domainAuthority = domainAuthority;
          } catch (e) {
            console.error('Error extracting domain or fetching Moz data:', e);
          }
        }
      }
      
      return serpData;
    } catch (error) {
      console.error("Error fetching SERP data:", error);
      return {
        organicResults: [],
        knowledgeGraph: null,
        relatedSearches: [],
        rankingPosition: null,
        hasKnowledgeGraph: false,
        topCompetitors: [],
        serp_features: {
          hasMap: false,
          hasNews: false,
          hasImages: false,
          hasVideos: false
        },
        error: error.message
      };
    }
  }
  
  export async function generateAiAnalysis(brandData: any) {
    // Implementation using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a brand analysis expert. Create a concise SWOT analysis based on the provided brand data.'
          },
          {
            role: 'user',
            content: `Generate a SWOT analysis for ${brandData.name}. Here's the data: ${JSON.stringify(brandData)}`
          }
        ]
      })
    });
    
    return await response.json();
  }

  // Helper functions
  function calculateSimpleSentiment(text) {
    const positiveWords = ['great', 'excellent', 'good', 'positive', 'success', 'innovative', 'best', 'leading', 'growth'];
    const negativeWords = ['bad', 'poor', 'negative', 'failure', 'scandal', 'problem', 'issue', 'worst', 'decline', 'lawsuit'];
    
    const lowerText = text.toLowerCase();
    
    let positive = 0;
    let negative = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positive++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negative++;
    });
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  function summarizeSentiment(articles) {
    const sentiments = articles.reduce((acc, article) => {
      acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });
    
    return sentiments;
  }

  function calculateSourceDiversity(articles) {
    const sources = new Set();
    articles.forEach(article => {
      if (article.source && article.source.name) {
        sources.add(article.source.name);
      }
    });
    
    // Return a 0-10 score based on source diversity
    return Math.min(10, Math.round((sources.size / articles.length) * 20));
  }

  function findBrandPosition(organicResults, brandName) {
    if (!organicResults || !organicResults.length) return null;
    
    const lowerBrand = brandName.toLowerCase();
    
    for (let i = 0; i < organicResults.length; i++) {
      const result = organicResults[i];
      if (
        (result.title && result.title.toLowerCase().includes(lowerBrand)) ||
        (result.link && result.link.toLowerCase().includes(lowerBrand))
      ) {
        return i + 1; // Position is 1-indexed
      }
    }
    
    return null; // Brand not found in top results
  }

  function extractCompetitors(serpData) {
    const competitors = [];
    
    // Check related searches for potential competitors
    if (serpData.related_searches) {
      serpData.related_searches.forEach(item => {
        if (item.query && item.query.toLowerCase().includes('vs ')) {
          const parts = item.query.split('vs ');
          competitors.push(parts[1].trim());
        }
      });
    }
    
    // Check "People also search for" section
    if (serpData.knowledge_graph && serpData.knowledge_graph.people_also_search_for) {
      serpData.knowledge_graph.people_also_search_for.forEach(item => {
        competitors.push(item.name);
      });
    }
    
    return [...new Set(competitors)].slice(0, 5); // Return up to 5 unique competitors
  }