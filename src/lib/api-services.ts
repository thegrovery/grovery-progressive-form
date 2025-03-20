// src/lib/api-services.ts
import { generateEnhancedSwotAnalysis } from './openai-api';

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
      const articles = data.articles.map((article: any) => {
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  export async function getSerpData(brandName: string) {
    try {
      const serpApiKey = import.meta.env.SERP_API_KEY;
      
      // If no API key, return mock data
      if (!serpApiKey) {
        console.warn('SERP_API_KEY not found, returning mock data');
        return {
          organicResults: [
            { position: 1, title: `${brandName} Official Website`, link: `https://www.${brandName.toLowerCase()}.com` },
            { position: 2, title: `${brandName} - Wikipedia`, link: `https://en.wikipedia.org/wiki/${brandName}` }
          ],
          knowledgeGraph: { title: brandName },
          relatedSearches: [`${brandName} products`, `${brandName} history`],
          rankingPosition: 1,
          hasKnowledgeGraph: true,
          domainAuthority: 65,
          topCompetitors: ['Competitor1', 'Competitor2'],
          serp_features: {
            hasMap: true,
            hasNews: true,
            hasImages: true,
            hasVideos: true
          }
        };
      }
      
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
            (serpData as any).domainAuthority = domainAuthority;
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  export async function generateAiAnalysis(brandData: any) {
    try {
      console.log("🔍 generateAiAnalysis called with brand:", brandData.name);
      
      // Check for OpenAI API key
      if (!import.meta.env.OPENAI_API_KEY) {
        console.error("❌ OpenAI API key is missing");
        return getFallbackAnalysis(brandData.name);
      }
      
      // Create enhanced brand data structure with validation
      const enhancedBrandData = {
        name: brandData.name || "Unknown Brand",
        sentimentScore: brandData.sentimentScore || 50,
        domainAuthority: brandData.domainAuthority || 0,
        news: brandData.news || { articles: [] },
        serp: brandData.serp || {},
        serpData: {
          totalResults: brandData.serp?.search_information?.total_results || 
                       brandData.serpTotalResults || 
                       "Unknown",
          organicResultsCount: brandData.serp?.organic_results?.length || 
                              brandData.organicResultsCount || 
                              0,
          topPosition: brandData.serp?.organic_results?.[0]?.position || "Unknown"
        }
      };
      
      console.log("🧩 Enhanced data prepared:", {
        name: enhancedBrandData.name,
        sentimentScore: enhancedBrandData.sentimentScore,
        serpTotalResults: enhancedBrandData.serpData.totalResults,
        newsArticleCount: enhancedBrandData.news?.articles?.length
      });

      // Import OpenAI function dynamically to ensure it's loaded
      let swotAnalysis;
      try {
        const { generateEnhancedSwotAnalysis } = await import('./openai-api');
        console.log("⚡ OpenAI function imported successfully");
        
        // Set timeout for OpenAI call (45 seconds)
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("OpenAI request timed out")), 45000)
        );
        
        console.log("🤖 Calling OpenAI for analysis...");
        swotAnalysis = await Promise.race([
          generateEnhancedSwotAnalysis(enhancedBrandData),
          timeout
        ]);
        
        console.log("✅ OpenAI analysis received:", 
          swotAnalysis ? `${swotAnalysis.substring(0, 50)}...` : "null");
      } catch (openaiError) {
        console.error("❌ OpenAI analysis error:", openaiError);
        return parseAnalysisText(`
          Strengths:
          - Brand analysis attempted
          
          Weaknesses:
          - Error connecting to AI service: ${openaiError.message}
          
          Opportunities:
          - Try again later when service is available
          
          Threats:
          - None identified
          
          Summary:
          We encountered a technical issue while analyzing this brand. Please try again later.
        `);
      }
      
      // If we got a string response, parse it into sections
      if (typeof swotAnalysis === 'string' && swotAnalysis.length > 0) {
        console.log("📊 Parsing AI analysis text...");
        return parseAnalysisText(swotAnalysis);
      } else {
        console.error("❌ Invalid OpenAI response format");
        return getFallbackAnalysis(brandData.name);
      }
    } catch (error) {
      console.error("💥 Fatal error in generateAiAnalysis:", error);
      return getFallbackAnalysis(brandData.name);
    }
  }

  // Helper functions
  function calculateSimpleSentiment(text: string) {
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

  function summarizeSentiment(articles: any) {
    const sentiments = articles.reduce((acc: any, article: any) => {
      acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });
    
    return sentiments;
  }

  function calculateSourceDiversity(articles: any) {
    const sources = new Set();
    articles.forEach((article: any) => {
      if (article.source && article.source.name) {
        sources.add(article.source.name);
      }
    });
    
    // Return a 0-10 score based on source diversity
    return Math.min(10, Math.round((sources.size / articles.length) * 20));
  }

  function findBrandPosition(organicResults: any, brandName: any) {
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

  function extractCompetitors(serpData: any) {
    const competitors: any[] = [];
    
    // Check related searches for potential competitors
    if (serpData.related_searches) {
      serpData.related_searches.forEach((item: any) => {
        if (item.query && item.query.toLowerCase().includes('vs ')) {
          const parts = item.query.split('vs ');
          competitors.push(parts[1].trim());
        }
      });
    }
    
    // Check "People also search for" section
    if (serpData.knowledge_graph && serpData.knowledge_graph.people_also_search_for) {
      serpData.knowledge_graph.people_also_search_for.forEach((item: any) => {
        competitors.push(item.name);
      });
    }
    
    return [...new Set(competitors)].slice(0, 5); // Return up to 5 unique competitors
  }

  // Helper function to parse the analysis text into structured data
  function parseAnalysisText(text: string) {
    console.log("🔍 Parsing analysis text of length:", text.length);
    
    try {
      // Initialize sections with empty arrays
      const sections: any = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        summary: ""
      };
      
      // Standardize the format to make parsing more reliable
      const standardizedText = text
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown ** formatting
        .replace(/^[#]+\s+/gm, "") // Remove any markdown headers
        .trim();
      
      // First split by clear section headers to avoid nested matches
      const parts = standardizedText.split(/(?:^|\n)(?:Strengths|Weaknesses|Opportunities|Threats|Summary):/i);
      
      // The first part is usually introductory text
      // Then the parts alternate between section name and content
      
      // Get the section names in the original order they appear
      const sectionOrder = standardizedText
        .match(/(?:^|\n)(Strengths|Weaknesses|Opportunities|Threats|Summary):/gi)
        ?.map(s => s.replace(/[^a-z]/gi, '').toLowerCase());
      
      if (!sectionOrder || sectionOrder.length === 0) {
        console.warn("⚠️ No standard SWOT sections found, using fallback parsing");
        // Use old regex approach as fallback
      } else {
        console.log("📋 Sections found in order:", sectionOrder);
        
        // For each section, extract the content from the respective part
        for (let i = 0; i < sectionOrder.length; i++) {
          const sectionName = sectionOrder[i].toLowerCase();
          const content = parts[i + 1]?.trim(); // +1 because first part is before any section
          
          if (content) {
            if (sectionName === 'summary') {
              sections.summary = content;
            } else {
              // Extract bullet points
              const bulletPoints = content
                .split(/\n/)
                .map(line => line.trim())
                .filter(line => line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
                .map(line => line.replace(/^[•\-\d\.]\s*/, '').trim());
              
              // If no bullet points found, use paragraph breaks
              const items = bulletPoints.length > 0 
                ? bulletPoints 
                : content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
              
              // Store in the appropriate section
              sections[sectionName] = items;
            }
          }
        }
      }
      
      // Verify we have content in each section
      console.log("✅ Parsed content:", {
        strengths: sections.strengths.length,
        weaknesses: sections.weaknesses.length,
        opportunities: sections.opportunities.length, 
        threats: sections.threats.length,
        summaryLength: sections.summary.length
      });
      
      return sections;
    } catch (error) {
      console.error("❌ Error parsing analysis text:", error);
      return {
        strengths: ["Error parsing analysis"],
        weaknesses: [],
        opportunities: [],
        threats: [],
        summary: "There was an error processing the analysis."
      };
    }
  }

  // Fallback analysis when API fails
  function getFallbackAnalysis(brandName: string) {
    return {
      strengths: ["Unable to analyze strengths due to API error"],
      weaknesses: ["Unable to analyze weaknesses due to API error"],
      opportunities: ["Unable to analyze opportunities due to API error"],
      threats: ["Unable to analyze threats due to API error"],
      summary: "We encountered an error analyzing this brand. Please try again later."
    };
  }

  // Calculate sentiment score based on multiple factors
  export function calculateSentimentScore(brandData: any) {
    // Base weights for different factors
    const weights = {
      newsSentiment: 0.3,
      searchPosition: 0.3,
      domainAuthority: 0.2,
      serpFeatures: 0.2
    };
    
    // Initialize score components
    let newsScore = 50; // Neutral default
    let searchScore = 0;
    let domainScore = 0;
    let serpScore = 0;
    
    // Calculate news sentiment score (0-100)
    if (brandData.news && brandData.news.articles) {
      const articles = brandData.news.articles;
      if (articles.length > 0) {
        // Count sentiment distribution
        const sentiments = articles.map((a: any) => a.sentiment || 'neutral');
        const positiveCount = sentiments.filter((s: any) => s === 'positive').length;
        const neutralCount = sentiments.filter((s: any) => s === 'neutral').length;
        const negativeCount = sentiments.filter((s: any) => s === 'negative').length;
        
        // Calculate weighted score (positive=100, neutral=50, negative=0)
        const totalArticles = articles.length;
        newsScore = totalArticles > 0 
          ? ((positiveCount * 100) + (neutralCount * 50) + (negativeCount * 0)) / totalArticles
          : 50;
      }
    }
    
    // Calculate search position score (0-100)
    if (brandData.serp && brandData.serp.organic_results && brandData.serp.organic_results.length > 0) {
      const topPosition = brandData.serp.organic_results[0].position || 10;
      // Position 1 = 100, Position 10+ = 0
      searchScore = Math.max(0, 100 - ((topPosition - 1) * 10));
    }
    
    // Calculate domain authority score (0-100)
    if (brandData.domainAuthority) {
      // Scale domain authority (typically 0-100) directly
      domainScore = brandData.domainAuthority;
    }
    
    // Calculate SERP features score (0-100)
    if (brandData.serp) {
      let featuresScore = 0;
      // Add points for each SERP feature
      if (brandData.serp.answer_box) featuresScore += 25;
      if (brandData.serp.knowledge_graph) featuresScore += 25;
      if (brandData.serp.local_results && brandData.serp.local_results.length > 0) featuresScore += 25;
      if (brandData.serp.related_questions && brandData.serp.related_questions.length > 0) featuresScore += 15;
      if (brandData.serp.related_searches && brandData.serp.related_searches.length > 0) featuresScore += 10;
      
      serpScore = Math.min(100, featuresScore);
    }
    
    // Calculate weighted average
    const weightedScore = 
      (newsScore * weights.newsSentiment) +
      (searchScore * weights.searchPosition) +
      (domainScore * weights.domainAuthority) +
      (serpScore * weights.serpFeatures);
    
    // Round to nearest integer
    return Math.round(weightedScore);
  }