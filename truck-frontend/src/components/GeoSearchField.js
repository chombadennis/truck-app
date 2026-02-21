import React, { useState, useRef } from 'react';
import Select from 'react-select';

const GeoSearchField = ({ onLocationSelect, placeholder, hasError }) => {
  const [options, setOptions] = useState([]);
  const debounceTimeout = useRef(null);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: hasError ? '#EF4444' : provided.borderColor, // Use Tailwind's red-500
      boxShadow: hasError ? '0 0 0 1px #EF4444' : provided.boxShadow,
      '&:hover': {
        borderColor: hasError ? '#EF4444' : provided.borderColor,
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      marginLeft: '2px',
    }),
    input: (provided) => ({
      ...provided,
      marginLeft: '2px',
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      color: '#2D3748',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#F7FAFC' : 'white', // A light gray for focused option
      color: '#2D3748', // A dark gray for text
      '&:active': {
        backgroundColor: '#EDF2F7', // A slightly darker gray for active option
      },
    }),
  };

  const fetchGeocodingData = (inputValue) => {
    const headers = new Headers({
      'User-Agent': 'Truck HOS Planner Demo/1.0 (cloud.google.com/)',
    });

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        inputValue
      )}&format=json&addressdetails=1`,
      { headers }
    )
      .then((response) => {
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
      styles={customStyles}
      options={options}
      onInputChange={handleInputChange}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable
      menuPortalTarget={document.body}
    />
  );
};

export default GeoSearchField;
