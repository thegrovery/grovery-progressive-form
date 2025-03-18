// SerpWow API integration

/**
 * Fetch location data from SerpWow Locations API
 * @param query Search query for locations
 * @param options Additional options like country_code, type
 */
export async function fetchLocationData(query: string, options: {
  country_code?: string,
  type?: string
} = {}) {
  try {
    const apiKey = import.meta.env.SERPWOW_API_KEY || 'demo'; // Use your API key from environment variables
    
    // Build URL with query parameters
    const params = new URLSearchParams({
      api_key: apiKey,
      q: query
    });
    
    // Add optional parameters
    if (options.country_code) params.append('country_code', options.country_code);
    if (options.type) params.append('type', options.type);
    
    const response = await fetch(`https://api.serpwow.com/live/locations?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`SerpWow API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching location data:', error);
    return [];
  }
}

/**
 * Get top locations for a brand based on search data
 * This combines SerpWow location data with brand relevance
 */
export async function getBrandLocationInsights(brandName: string) {
  try {
    // Get locations data for the brand
    const locations = await fetchLocationData(brandName);
    
    // Sort by reach (popularity)
    const sortedLocations = locations.sort((a, b) => b.reach - a.reach);
    
    // Take top locations (max 10)
    return sortedLocations.slice(0, 10).map(location => ({
      name: location.name,
      fullName: location.full_name,
      countryCode: location.country_code,
      type: location.type,
      reach: location.reach,
      // Extract coordinates (would need a geocoding service in production)
      // For now, use approximate coordinates based on country code
      coordinates: getApproximateCoordinates(location.country_code)
    }));
  } catch (error) {
    console.error('Error getting brand location insights:', error);
    return [];
  }
}

/**
 * Get approximate coordinates for a country code
 * In a production app, you would use a proper geocoding service
 */
function getApproximateCoordinates(countryCode: string): [number, number] {
  const coordinates: Record<string, [number, number]> = {
    'US': [37.0902, -95.7129],
    'GB': [55.3781, -3.4360],
    'CA': [56.1304, -106.3468],
    'AU': [-25.2744, 133.7751],
    'DE': [51.1657, 10.4515],
    'FR': [46.2276, 2.2137],
    'JP': [36.2048, 138.2529],
    'BR': [-14.2350, -51.9253],
    'IN': [20.5937, 78.9629],
    // Add more as needed
  };
  
  return coordinates[countryCode] || [0, 0];
} 