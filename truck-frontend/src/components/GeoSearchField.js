import React, { useState, useRef } from 'react';
import Select from 'react-select';

// Custom styles to fix the placeholder alignment issue
const customStyles = {
  placeholder: (provided) => ({
    ...provided,
    marginLeft: '2px', // Nudge the placeholder to the right
  }),
  input: (provided) => ({
    ...provided,
    marginLeft: '2px',
  }),
};

const GeoSearchField = ({ onLocationSelect, placeholder }) => {
  const [options, setOptions] = useState([]);
  const debounceTimeout = useRef(null);

  // This function now uses fetch() directly to control the User-Agent header
  const fetchGeocodingData = (inputValue) => {
    // A unique User-Agent is required by Nominatim's usage policy.
    const headers = new Headers({
        'User-Agent': 'Truck HOS Planner Demo/1.0 (cloud.google.com/)'
    });

    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&addressdetails=1`, { headers })
      .then(response => {
        if (!response.ok) {
            throw new Error(`Nominatim API failed: ${response.statusText}`);
        }
        return response.json();
      })
      .then((results) => {
        const newOptions = results.map((result) => ({
          value: {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
          },
          label: result.display_name,
        }));
        setOptions(newOptions);
      })
      .catch((error) => {
        console.error('Error fetching geocoding data:', error);
        setOptions([]);
      });
  };

  const handleInputChange = (inputValue) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (inputValue.length > 2) {
        // Increased debounce time to be safer
      debounceTimeout.current = setTimeout(() => fetchGeocodingData(inputValue), 800);
    } else {
      setOptions([]);
    }
  };

  const handleChange = (selectedOption) => {
    onLocationSelect(selectedOption ? selectedOption.value : null);
  };

  return (
    <Select
      styles={customStyles} // Apply the custom styles here
      options={options}
      onInputChange={handleInputChange}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable
    />
  );
};

export default GeoSearchField;
