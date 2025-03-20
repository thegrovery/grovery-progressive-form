// OpenAI API integration for brand analysis
import { isProbablyMedication, getCompanyInfo } from './brand-utils';

/**
 * Call OpenAI API with a structured prompt
 */
export async function callOpenAI(prompt: string, systemPrompt: string = '', model: string = 'gpt-4') {
  try {
    // Check if OpenAI API key is configured
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key is not configured");
      throw new Error("OpenAI API key is not configured");
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model, // Default to GPT-4 for better analysis
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a brand analysis expert who provides concise, data-driven analyses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data);
      throw new Error("Unexpected API response format");
    }
    
    return data.choices[0].message.content || '';
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

/**
 * Generate geographical insights for a brand
 */
export async function generateBrandGeoInsights(brandName: string) {
  // Get company info to provide better context
  const companyInfo = await getCompanyInfo(brandName);
  const isMedication = companyInfo?.type === 'medication';
  
  const systemPrompt = `
    You are a friendly and insightful brand analysis expert specializing in brand sentiment and market presence.
    ${isMedication ? 'For pharmaceutical products, focus on major markets like US, EU, Japan, Canada, and Australia.' : 'For consumer brands, identify their headquarters and major markets.'}
    Provide accurate, research-based insights without confusing brand names with location names.
  `;
  
  const prompt = `
    Provide geographical insights for the brand "${brandName}".
    
    ${isMedication ? `This is a pharmaceutical product manufactured by ${companyInfo?.name || 'unknown manufacturer'}.` : ''}
    ${companyInfo?.type === 'company' ? `This is a company in the ${companyInfo?.industry || ''} industry.` : ''}
    
    ${isMedication ? 
      'List the top 5 countries where this medication is likely prescribed or sold. Focus on major pharmaceutical markets (US, EU, Japan, etc.).' : 
      'Identify the headquarters country and list the top 5 countries where they have market presence.'}
    
    DO NOT confuse the brand name with similarly named locations.
    
    Return the data as a JSON object with this structure:
    {
      "brandType": "${isMedication ? 'pharmaceutical' : (companyInfo?.type === 'company' ? 'company' : 'other')}",
      ${isMedication ? `"manufacturer": "${companyInfo?.name || ''}"` : ''}
      ${companyInfo?.type === 'company' ? `"headquarters": "${companyInfo?.hq || ''}"` : ''}
      "locations": [
        {"name": "Country Name", "countryCode": "2-letter code", "reach": numeric value 1-100}
      ]
    }
  `;

  try {
    const result = await callOpenAI(prompt, systemPrompt);
    // Parse the JSON response
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/({[\s\S]*})/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(result);
  } catch (error) {
    console.error("Error generating geographical insights:", error);
    return {
      brandType: isMedication ? "pharmaceutical" : (companyInfo?.type || "unknown"),
      locations: []
    };
  }
}

/**
 * Generate enhanced SWOT analysis for a brand
 */
export async function generateEnhancedSwotAnalysis(brandData: any) {
  // Use the utility function to determine if this is a pharmaceutical product
  const isPharma = isProbablyMedication(brandData.name);
  
  // Get additional company info if available
  const companyInfo = await getCompanyInfo(brandData.name);
  
  // Log the brand data received by this function
  console.log("OpenAI function received brand data:", {
    brandName: brandData.name,
    isPharma,
    companyInfo,
    serpData: brandData.serpData,
    rawSerpTotalResults: brandData.serp?.totalResults,
    serpDataTotalResults: brandData.serpData?.totalResults,
    news: brandData.news
  });
  
  const systemPrompt = `
    You are a friendly and insightful brand analysis expert specializing in brand sentiment and market presence.
    ${isPharma ? 'You have particular expertise in pharmaceutical products and healthcare brands.' : ''}
    ${companyInfo?.industry ? `This brand is in the ${companyInfo.industry} industry.` : ''}
    Provide a comprehensive, data-driven SWOT analysis based on the information provided.
    Focus on actionable insights and industry-specific context.
    
    IMPORTANT INSTRUCTIONS:
    1. Pay close attention to the actual data provided. Do not make claims that contradict the data.
    2. If search results show high numbers (millions), this indicates significant online presence, NOT limited visibility.
    3. If sentiment is positive, do not claim negative perception without evidence.
    4. Base your analysis strictly on the provided data, not on general assumptions.
  `;
  
  const prompt = `
    Perform a detailed SWOT analysis for the brand "${brandData.name}" based on the following data:
    
    ${isPharma ? `Note: This appears to be a pharmaceutical product${companyInfo?.name ? ` manufactured by ${companyInfo.name}` : ''}. Consider regulatory factors, patent status, and healthcare market dynamics in your analysis.` : ''}
    ${companyInfo?.type === 'company' ? `Note: This is a company in the ${companyInfo.industry || 'unknown'} industry${companyInfo.hq ? ` headquartered in ${companyInfo.hq}` : ''}.` : ''}
    
    Sentiment Score: ${brandData.sentimentScore}/100
    Domain Authority: ${brandData.domainAuthority || 'Unknown'}
    
    News Articles: ${brandData.news?.articles?.length || 0} articles found
    ${brandData.news?.articles?.slice(0, 5).map((a: any) => `- ${a.title} (Sentiment: ${a.sentiment || 'neutral'})`).join('\n') || 'No articles available'}
    
    SEARCH RESULTS DATA:
    - Total Results: ${brandData.serpData?.totalResults || brandData.serp?.totalResults || 'Unknown'} 
    - Organic Results Displayed: ${brandData.serpData?.organicResultsCount || brandData.serp?.organicResults?.length || 0}
    - Top Position: ${brandData.serpData?.topPosition || brandData.serp?.topPosition || 'Unknown'}
    - SERP Features: ${(brandData.serpData?.features || brandData.serp?.features || []).join(', ') || 'None'}
    
    Top Organic Results:
    ${brandData.serp?.organicResults?.slice(0, 5).map((r: any, i: number) => `${i+1}. ${r.title}`).join('\n') || 'No specific search results available'}
    
    ${brandData.serp?.localResults ? `Local Results: ${brandData.serp.localResults.length} locations found` : ''}
    
    Provide a comprehensive SWOT analysis with:
    1. Strengths: What advantages does this brand have based on the data?
    2. Weaknesses: What disadvantages or areas of improvement does the brand have?
    3. Opportunities: What external factors could the brand leverage for growth?
    4. Threats: What external factors could harm the brand's performance?
    5. Summary: A brief overview of the brand's current position and outlook.
    
    For each point, provide 2-4 specific insights with asterisks (**) around the key finding, followed by a brief explanation.
    
    CRITICAL: If the total search results are in the millions (e.g., 84.4M), this indicates VERY HIGH online visibility and presence. Do NOT state that the brand has limited visibility or awareness in this case.
  `;

  // Log the final prompt being sent to OpenAI
  console.log("Final prompt being sent to OpenAI:", {
    systemPrompt: systemPrompt.substring(0, 100) + "...",
    promptFirstPart: prompt.substring(0, 200) + "...",
    promptSearchResultsSection: prompt.match(/SEARCH RESULTS DATA:[\s\S]*?(?=Top Organic Results:)/)?.[0] || "Not found"
  });

  try {
    return await callOpenAI(prompt, systemPrompt, 'gpt-4');
  } catch (error) {
    console.error("Error generating enhanced SWOT analysis:", error);
    return null;
  }
} 