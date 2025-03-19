/**
 * Utility functions for brand analysis
 */

/**
 * Check if a brand name is likely a medication
 */
export function isProbablyMedication(brandName: string): boolean {
  // Common medication name endings
  const medicationSuffixes = ['mab', 'zumab', 'ximab', 'umab', 'tinib', 'ciclib', 'vastatin', 
    'prazole', 'sartan', 'oxacin', 'mycin', 'cillin', 'dronate', 'lukast', 'pril', 'dipine'];
  
  // Known medication names
  const knownMedications = [
    'orencia', 'humira', 'keytruda', 'ozempic', 'wegovy', 'jardiance', 'eliquis', 
    'xarelto', 'januvia', 'trulicity', 'biktarvy', 'dupixent', 'skyrizi', 'rinvoq'
  ];
  
  const lowerName = brandName.toLowerCase();
  
  return medicationSuffixes.some(suffix => lowerName.endsWith(suffix)) || 
         knownMedications.includes(lowerName);
}

/**
 * Get company information for a brand
 */
export async function getCompanyInfo(brandName: string) {
  // For medications, try to identify the manufacturer
  if (isProbablyMedication(brandName)) {
    const medicationManufacturers = {
      'orencia': { name: 'Bristol Myers Squibb', type: 'medication', category: 'Immunology' },
      'humira': { name: 'AbbVie', type: 'medication', category: 'Immunology' },
      'keytruda': { name: 'Merck', type: 'medication', category: 'Oncology' },
      'ozempic': { name: 'Novo Nordisk', type: 'medication', category: 'Diabetes' },
      'wegovy': { name: 'Novo Nordisk', type: 'medication', category: 'Weight Management' },
      // Add more as needed
    };
    
    return medicationManufacturers[brandName.toLowerCase()] || { type: 'medication', category: 'Pharmaceutical' };
  }
  
  // For known companies
  const knownCompanies = {
    'novo nordisk': { name: 'Novo Nordisk', type: 'company', industry: 'Pharmaceutical', hq: 'Denmark' },
    'apple': { name: 'Apple', type: 'company', industry: 'Technology', hq: 'United States' },
    'microsoft': { name: 'Microsoft', type: 'company', industry: 'Technology', hq: 'United States' },
    'google': { name: 'Google', type: 'company', industry: 'Technology', hq: 'United States' },
    'amazon': { name: 'Amazon', type: 'company', industry: 'E-commerce', hq: 'United States' },
    // Add more as needed
  };
  
  return knownCompanies[brandName.toLowerCase()] || { name: brandName, type: 'unknown' };
} 