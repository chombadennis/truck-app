import debounce from 'lodash.debounce';

// Centralized API configuration
const GEOCODING_API_URL = 'https://api.geoapify.com/v1/geocode/search';
const REVERSE_GEOCODING_API_URL = 'https://api.geoapify.com/v1/geocode/reverse';

// Access the API key from environment variables
const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

/**
 * Fetches address suggestions from the Geoapify API for the GeoSearchField component.
 */
export const fetchSuggestions = async (query) => {
  if (!query || query.length < 3) return [];
  
  if (!API_KEY) {
    console.error("Geoapify API key is missing. Please check your .env file and restart the server.");
    return [];
  }

  try {
    const response = await fetch(`${GEOCODING_API_URL}?text=${encodeURIComponent(query)}&apiKey=${API_KEY}`);
    const data = await response.json();

    if (response.status !== 200) {
      console.error("Geoapify API error:", data.message || "Unknown error");
      return [];
    }

    return data.features || [];
  } catch (error) {
    console.error('Error fetching geocoding suggestions:', error);
    return [];
  }
};

/**
 * Performs reverse geocoding to find a location name from coordinates.
 */
export const reverseGeocode = async (lat, lon) => {
  // Add explicit check and error for missing API key
  if (!API_KEY) {
    console.error("Geoapify API key is missing. Please check your .env file and restart the server.");
    return `${lat}, ${lon}`; // Return fallback
  }

  // Return empty if coordinates are missing.
  if (!lat || !lon) return ''; 

  try {
    const response = await fetch(`${REVERSE_GEOCODING_API_URL}?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`);
    const data = await response.json();

    // Check for error response from API
    if (response.status !== 200) {
        console.error("Geoapify API error:", data.message || "Unknown error");
        return `${lat}, ${lon}`; // Return fallback
    }

    if (data.features && data.features.length > 0) {
      return data.features[0].properties.formatted; // Success
    }
    
    // Return fallback if no location is found
    return `${lat}, ${lon}`;
  } catch (error) {
    console.error('Error during reverse geocoding fetch:', error);
    return `${lat}, ${lon}`; // Return fallback on network error
  }
};


// Debounced version of fetchSuggestions for use in UI to prevent excessive API calls.
export const debouncedFetchSuggestions = debounce(async (query, callback) => {
    const suggestions = await fetchSuggestions(query);
    callback(suggestions);
}, 300);
