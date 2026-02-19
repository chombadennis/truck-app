import React, { useState } from "react";
import TripForm from "./components/TripForm";
import MapComponent from "./components/MapComponents";
import ELDLog from "./components/ELDLog";
import axios from "axios";
import { reverseGeocode } from "./utils/geo";
import './App.css'; // <--- IMPORT THE CSS FILE

// This function is updated to add descriptive notes to all event types.
export function generateELDEvents(
  events = [],
  totalDistance = 0,
  pickupTime = null,
  dropoffTime = null
) {
  const result = [];

  // Add pickup event with a clear note.
  if (pickupTime) {
    result.push({
      status: "ON",
      timestamp: new Date(pickupTime).toISOString(),
      duration_minutes: 60,
      note: "Pickup Operations",
      miles: 0,
    });
  }

  let lastMiles = 0;
  let lastTimestamp = pickupTime ? new Date(pickupTime) : new Date();

  // Process events from the backend.
  for (let ev of events) {
    const deltaMiles = Number(ev.miles || 0);
    lastMiles += deltaMiles;

    const currentTimestamp = new Date(ev.timestamp);
    
    // --- NEW: Add default notes based on status ---
    let note = ev.note; // Keep existing note if present
    if (!note) {
      switch (ev.status) {
        case "DRIVE":
          note = "Driving";
          break;
        case "ON":
          note = "On Duty, Not Driving";
          break;
        case "OFF":
          note = "Off Duty";
          break;
        case "SLEEPER":
          note = "Sleeper Berth";
          break;
        default:
          note = "Unspecified Activity";
      }
    }

    result.push({
      ...ev,
      note, // Add the new descriptive note
      miles: deltaMiles,
      timestamp: currentTimestamp.toISOString(),
    });

    // Check if a fuel stop is needed.
    const fuelInterval = 1000;
    while (lastMiles >= fuelInterval) {
      // Ensure fuel stop timestamp is logical
      lastTimestamp = new Date(Math.max(lastTimestamp.getTime(), currentTimestamp.getTime()) + 30 * 60000);
      result.push({
        status: "ON",
        timestamp: lastTimestamp.toISOString(),
        duration_minutes: 30,
        note: "Fuel Stop ⚡",
        qualifying_break: true,
        miles: 0,
      });
      lastMiles -= fuelInterval;
    }

    lastTimestamp = currentTimestamp;
  }

  // Add dropoff event with a clear note.
  if (dropoffTime) {
    result.push({
      status: "ON",
      timestamp: new Date(dropoffTime).toISOString(),
      duration_minutes: 60,
      note: "Dropoff Operations",
      miles: 0,
    });
  }

  // Sort all events chronologically before returning.
  return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}


export default function App() {
  // State for map and events
  const [routeGeo, setRouteGeo] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for coordinates
  const [startCoords, setStartCoords] = useState({ lat: "", lng: "" });
  const [pickupCoords, setPickupCoords] = useState({ lat: "", lng: "" });
  const [dropoffCoords, setDropoffCoords] = useState({ lat: "", lng: "" });

  // New state for ELD metadata
  const [eldMetadata, setEldMetadata] = useState(null);

  const handlePlan = async (payload) => {
    setIsLoading(true);
    setEldMetadata(null); // Clear previous metadata
    try {
      // The backend API call doesn't need the metadata, so we can separate it.
      const { metadata, ...apiPayload } = payload;
      
      // **FIX: Add the hardcoded driver_id back into the API payload**
      apiPayload.driver_id = 1; 

      const res = await axios.post(`/api/plan-trip/`, apiPayload);
      
      // Set ELD metadata received from the form
      setEldMetadata(metadata);

      if (res.data.route) setRouteGeo(res.data.route.geojson);

      setStartCoords(
        payload.start_coords
          ? { lat: payload.start_coords[1], lng: payload.start_coords[0] }
          : { lat: "", lng: "" }
      );
      setPickupCoords(
        payload.pickup_coords
          ? { lat: payload.pickup_coords[1], lng: payload.pickup_coords[0] }
          : { lat: "", lng: "" }
      );
      setDropoffCoords(
        payload.dropoff_coords
          ? { lat: payload.dropoff_coords[1], lng: payload.dropoff_coords[0] }
          : { lat: "", lng: "" }
      );

      const rawEvents = res.data.events || [];

      // --- FIX: Correctly parse lat/lon and call reverse geocode ---
      const processedEvents = await Promise.all(rawEvents.map(async (ev) => {
        if (ev.location && typeof ev.location === 'string' && ev.location.includes(',')) {
            // The backend sends "lat,lon" but the code was parsing "lon,lat". This is the fix.
            const [lat, lon] = ev.location.split(',');
            const placeName = await reverseGeocode(lat, lon);

            const fallbackValue = `${lat}, ${lon}`;

            let enhancedLocation;

            if (placeName && placeName !== fallbackValue) {
                // Success: We have a real name. Format as "Name (lat, lon)".
                enhancedLocation = `${placeName} (${lat}, ${lon})`;
            } else {
                // Failure or fallback: Just use the original coordinates.
                enhancedLocation = ev.location;
            }
            
            return { ...ev, location: enhancedLocation };
        }
        return ev;
      }));
      
      const enhancedEvents = generateELDEvents(
        processedEvents, // Use the events with human-readable locations
        res.data.summary?.total_distance || 0,
        payload.pickup_time || null,
        payload.dropoff_time || null
      );
      setEvents(enhancedEvents);
    } catch (err) {
      console.error("Plan trip error", err.response?.data || err.message);
      alert("Error planning trip. Check console.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>HOS Planner</h1>
      </header>

      <div className="content-card">
        <TripForm onPlan={handlePlan} isLoading={isLoading} />
      </div>

      <div className="content-card">
        <h3 className="section-header">Route Map & Coordinates</h3>
        <MapComponent
          routeGeojson={routeGeo}
          start={startCoords}
          pickup={pickupCoords}
          dropoff={dropoffCoords}
        />
      </div>

      {eldMetadata && (
        <div className="content-card">
            <h3 className="section-header">ELD Log Preview</h3>
            <ELDLog
            events={events}
            metadata={eldMetadata}
            />
        </div>
      )}
    </div>
  );
}
