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
      // Check if OpenAI API key is configured
      const apiKey = import.meta.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("OpenAI API key is not configured");
        return getFallbackAnalysis(brandData.name);
      }

      // Log the data we're sending to OpenAI
      console.log("Preparing OpenAI analysis with data:", {
        brandName: brandData.name,
        sentimentScore: brandData.sentimentScore,
        domainAuthority: brandData.domainAuthority,
        newsArticlesCount: brandData.news?.articles?.length || 0,
        serpResultsCount: brandData.serp?.organicResults?.length || 0
      });
      
      // Prepare the prompt with brand data
      const prompt = `
        Perform a SWOT analysis for the brand "${brandData.name}" based on the following data:
        
        Sentiment Score: ${brandData.sentimentScore}/100
        Domain Authority: ${brandData.domainAuthority || 'Unknown'}
        
        News Articles: ${brandData.news?.articles?.length || 0} articles found
        ${brandData.news?.articles?.slice(0, 3).map((a: any) => `- ${a.title} (Sentiment: ${a.sentiment || 'neutral'})`).join('\n') || 'No articles available'}
        
        Search Results: ${brandData.serp?.organicResults?.length || 0} results found
        ${brandData.serp?.organicResults?.slice(0, 3).map((r: any) => `- ${r.title}`) || 'No search results available'}
        
        Provide a comprehensive SWOT analysis with:
        - Strengths: What advantages does this brand have based on the data?
        - Weaknesses: What disadvantages or areas of improvement does the brand have?
        - Opportunities: What external factors could the brand leverage for growth?
        - Threats: What external factors could harm the brand's performance?
        
        Format your response with clear sections for Strengths, Weaknesses, Opportunities, Threats, and a brief Summary.
      `;

      console.log("Calling OpenAI API with prompt length:", prompt.length);
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // You can use 'gpt-4' for better results if available
          messages: [
            {
              role: 'system',
              content: 'You are a brand analysis expert who provides concise, data-driven SWOT analyses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API error:", response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("OpenAI API response received");
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected API response format:", data);
        return getFallbackAnalysis(brandData.name);
      }
      
      const analysisText = data.choices[0].message.content || '';
      console.log("Raw OpenAI response text:", analysisText);
      
      // Parse the analysis text into structured data
      return parseAnalysisText(analysisText);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
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
    try {
      console.log("Starting to parse analysis text:", text.substring(0, 100) + "...");
      
      const sections = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        summary: ''
      };
      
      // Extract strengths
      const strengthsMatch = text.match(/Strengths:?\s*([\s\S]*?)(?=Weaknesses:|$)/i);
      console.log("Strengths match:", strengthsMatch ? "Found" : "Not found");
      if (strengthsMatch && strengthsMatch[1]) {
        const strengthsText = strengthsMatch[1];
        console.log("Raw strengths text:", strengthsText);
        
        // Try different bullet point patterns
        let strengthLines = strengthsText.split('\n')
          .filter((line: string) => line.trim().startsWith('-') || 
                          line.trim().startsWith('•') || 
                          line.trim().startsWith('*') ||
                          /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^[•\-*\d\.]\s*/, '').trim())
          .filter(line => line);
        
        // If no bullet points found, try to split by newlines
        if (strengthLines.length === 0) {
          strengthLines = strengthsText.split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line && !line.toLowerCase().includes('strengths'));
        }
        
        sections.strengths = strengthLines as any;
        console.log("Parsed strengths:", sections.strengths);
      }
      
      // Extract weaknesses (similar approach)
      const weaknessesMatch = text.match(/Weaknesses:?\s*([\s\S]*?)(?=Opportunities:|$)/i);
      console.log("Weaknesses match:", weaknessesMatch ? "Found" : "Not found");
      if (weaknessesMatch && weaknessesMatch[1]) {
        const weaknessesText = weaknessesMatch[1];
        
        let weaknessLines = weaknessesText.split('\n')
          .filter((line: string) => line.trim().startsWith('-') || 
                          line.trim().startsWith('•') || 
                          line.trim().startsWith('*') ||
                          /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^[•\-*\d\.]\s*/, '').trim())
          .filter(line => line);
        
        if (weaknessLines.length === 0) {
          weaknessLines = weaknessesText.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.toLowerCase().includes('weaknesses'));
        }
        
        sections.weaknesses = weaknessLines as any;
      }
      
      // Extract opportunities (similar approach)
      const opportunitiesMatch = text.match(/Opportunities:?\s*([\s\S]*?)(?=Threats:|$)/i);
      console.log("Opportunities match:", opportunitiesMatch ? "Found" : "Not found");
      if (opportunitiesMatch && opportunitiesMatch[1]) {
        const opportunitiesText = opportunitiesMatch[1];
        
        let opportunityLines = opportunitiesText.split('\n')
          .filter(line => line.trim().startsWith('-') || 
                          line.trim().startsWith('•') || 
                          line.trim().startsWith('*') ||
                          /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^[•\-*\d\.]\s*/, '').trim())
          .filter(line => line);
        
        if (opportunityLines.length === 0) {
          opportunityLines = opportunitiesText.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.toLowerCase().includes('opportunities'));
        }
        
        sections.opportunities = opportunityLines as any;
      }
      
      // Extract threats (similar approach)
      const threatsMatch = text.match(/Threats:?\s*([\s\S]*?)(?=Summary:|$)/i);
      console.log("Threats match:", threatsMatch ? "Found" : "Not found");
      if (threatsMatch && threatsMatch[1]) {
        const threatsText = threatsMatch[1];
        
        let threatLines = threatsText.split('\n')
          .filter(line => line.trim().startsWith('-') || 
                          line.trim().startsWith('•') || 
                          line.trim().startsWith('*') ||
                          /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^[•\-*\d\.]\s*/, '').trim())
          .filter(line => line);
        
        if (threatLines.length === 0) {
          threatLines = threatsText.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.toLowerCase().includes('threats'));
        }
        
        sections.threats = threatLines as any;
      }
      
      // Extract summary
      const summaryMatch = text.match(/Summary:?\s*([\s\S]*?)$/i);
      console.log("Summary match:", summaryMatch ? "Found" : "Not found");
      if (summaryMatch && summaryMatch[1]) {
        sections.summary = summaryMatch[1].trim();
      } else {
        // If no explicit summary section, use the last paragraph
        const paragraphs = text.split('\n\n');
        const lastParagraph = paragraphs[paragraphs.length - 1].trim();
        if (lastParagraph && !lastParagraph.match(/^(Strengths|Weaknesses|Opportunities|Threats):/i)) {
          sections.summary = lastParagraph;
        }
      }
      
      console.log("Final parsed sections:", {
        strengthsCount: sections.strengths.length,
        weaknessesCount: sections.weaknesses.length,
        opportunitiesCount: sections.opportunities.length,
        threatsCount: sections.threats.length,
        summaryLength: sections.summary.length
      });
      
      return sections;
    } catch (error) {
      console.error("Error parsing analysis text:", error);
      return {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        summary: "Error parsing analysis."
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