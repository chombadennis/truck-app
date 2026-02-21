
import React, { useState, useEffect } from "react";
import TripForm from "./components/TripForm";
import MapComponent from "./components/MapComponents";
import ELDLog from "./components/ELDLog";
import AlertDialog from "./components/AlertDialog";
import axios from 'axios'; // <-- Import axios directly
import { reverseGeocode } from "./utils/geo";

// --- NEW: Environment-aware API endpoint ---
const API_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : '';

const apiClient = axios.create({
  baseURL: API_ENDPOINT
});
// --- End of new logic ---

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

  // --- NEW: State for server connection and HOS rules ---
  const [isConnecting, setIsConnecting] = useState(true);
  const [hosRules, setHosRules] = useState([]);
  // ---

  // State for coordinates
  const [startCoords, setStartCoords] = useState({ lat: "", lng: "" });
  const [pickupCoords, setPickupCoords] = useState({ lat: "", lng: "" });
  const [dropoffCoords, setDropoffCoords] = useState({ lat: "", lng: "" });

  // New state for ELD metadata
  const [eldMetadata, setEldMetadata] = useState(null);

  // New state for the alert dialog
  const [alertInfo, setAlertInfo] = useState({ isOpen: false });

  // --- NEW: useEffect to fetch HOS rules on initial load ---
  useEffect(() => {
    const fetchHosRules = async () => {
      try {
        const response = await apiClient.get("/api/rules/");
        setHosRules(response.data || []);
      } catch (error) {
        console.error("Error fetching HOS rules:", error);
        setAlertInfo({
          isOpen: true,
          type: 'error',
          title: 'Backend Connection Error',
          message: 'Could not fetch compliance rules from the server. This can happen when the server is waking up from sleep. Please wait a moment and then refresh the page.',
        });
      } finally {
        setIsConnecting(false);
      }
    };

    fetchHosRules();
  }, []); // Empty dependency array ensures this runs only once on mount.
  // ---

  const handlePlan = async (payload) => {
    setIsLoading(true);
    setEldMetadata(null); // Clear previous metadata
    try {
      // Use the pre-configured axios client
      const res = await apiClient.post(`/api/plan-trip/`, payload);
      
      if (payload.metadata) {
          setEldMetadata(payload.metadata);
      }

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

      const processedEvents = await Promise.all(rawEvents.map(async (ev) => {
        if (ev.location && typeof ev.location === 'string' && ev.location.includes(',')) {
            const [lat, lon] = ev.location.split(',');
            const placeName = await reverseGeocode(lat, lon);
            const fallbackValue = `${lat}, ${lon}`;
            let enhancedLocation;
            if (placeName && placeName !== fallbackValue) {
                enhancedLocation = `${placeName} (${lat}, ${lon})`;
            } else {
                enhancedLocation = ev.location;
            }
            return { ...ev, location: enhancedLocation };
        }
        return ev;
      }));
      
      const enhancedEvents = generateELDEvents(
        processedEvents,
        res.data.summary?.total_distance || 0,
        payload.pickup_time || null,
        payload.dropoff_time || null
      );
      setEvents(enhancedEvents);

      // Show success dialog
      setAlertInfo({
        isOpen: true,
        type: 'success',
        title: 'Trip Planned Successfully!',
        message: 'Your route and ELD logs are ready. You can view them below.',
      });

    } catch (err) {
      console.error("Plan trip error", err.response?.data || err.message);
      let title = "An Unexpected Error Occurred";
      let message = "Something went wrong. Please try again later or check the console for details.";

      if (err.response) {
        // Handle specific backend errors
        const errorData = err.response.data;
        if (err.response.status === 400) {
          title = "Invalid Input";
          message = errorData.error || "Please check the provided trip details. One or more fields are invalid.";
        } else if (err.response.status === 500) {
          title = "Server Error";
          message = errorData.error || "A problem occurred on our server. We are looking into it.";
        }
      } else if (err.request) {
        // Handle network errors
        title = "Network Error";
        message = "Could not connect to the server. Please check your internet connection and try again.";
      }

      setAlertInfo({ isOpen: true, type: 'error', title, message });
    } finally {
      setIsLoading(false);
    }
  };

  const closeAlert = () => setAlertInfo({ isOpen: false });

  // --- NEW: Render a loading screen while connecting to the backend ---
  if (isConnecting) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-center text-amber-flame-500 font-serif mb-4">HOS Planner</h1>
        {/* Simple spinner using Tailwind */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-flame-500 mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">Connecting to the server...</p>
        <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds on our free hosting plan.</p>
      </div>
    );
  }
  // ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AlertDialog 
        isOpen={alertInfo.isOpen} 
        onClose={closeAlert} 
        title={alertInfo.title} 
        message={alertInfo.message} 
        type={alertInfo.type} 
      />

      <header className="bg-orange-950 p-5 rounded-lg shadow-lg mb-8 border-b-4 border-amber-flame-500">
        <h1 className="text-3xl font-bold text-center text-amber-flame-500 font-serif">HOS Planner</h1>
      </header>

      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-2xl p-6 mb-6 border border-amber-flame-500 hover:border-amber-flame-400 transition-all duration-300">
        <h2 className="text-2xl font-bold text-center text-deep-saffron-500 mb-2 font-serif">In this planner:</h2>
        <p className="text-center text-gray-600 mb-6">This application helps truck drivers plan their trips while adhering to Hours of Service (HOS) regulations.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-amber-flame-50 p-4 rounded-lg shadow-md hover:shadow-lg hover:border-deep-saffron-500 border-2 border-transparent transition-all duration-300">
            <h3 className="text-lg font-semibold text-cayenne-red-600 mb-2 font-serif">Plan Your Trip</h3>
            <p className="text-gray-700">Enter your start, pickup, and dropoff locations to generate a route and an ELD-compliant log.</p>
          </div>
          <div className="bg-amber-flame-50 p-4 rounded-lg shadow-md hover:shadow-lg hover:border-deep-saffron-500 border-2 border-transparent transition-all duration-300">
            <h3 className="text-lg font-semibold text-cayenne-red-600 mb-2 font-serif">Visualize Your Route</h3>
            <p className="text-gray-700">See your entire route on an interactive map, including all the required stops and breaks.</p>
          </div>
          <div className="bg-amber-flame-50 p-4 rounded-lg shadow-md hover:shadow-lg hover:border-deep-saffron-500 border-2 border-transparent transition-all duration-300">
            <h3 className="text-lg font-semibold text-cayenne-red-600 mb-2 font-serif">Stay Compliant</h3>
            <p className="text-gray-700">Automatically generate ELD logs with all the necessary events, ensuring you stay compliant with HOS rules.</p>
          </div>
        </div>
      </div>

      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-2xl p-6 mb-6 border border-amber-flame-500 hover:border-amber-flame-400 transition-all duration-300">
        {/* --- MODIFIED: Pass hosRules to TripForm --- */}
        <TripForm onPlan={handlePlan} isLoading={isLoading} hosRules={hosRules} />
      </div>

      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-2xl p-6 mb-6 border border-amber-flame-500 hover:border-amber-flame-400 transition-all duration-300">
        <h3 className="text-xl font-semibold text-center text-deep-saffron-500 mb-4 pb-2 border-b-2 border-deep-saffron-200 font-serif">Route Map & Coordinates</h3>
        <MapComponent
          routeGeojson={routeGeo}
          start={startCoords}
          pickup={pickupCoords}
          dropoff={dropoffCoords}
        />
      </div>

      {eldMetadata && (
        <div className="rounded-xl shadow-2xl p-6 mb-6 border border-amber-flame-500 hover:border-amber-flame-400 transition-all duration-300" style={{backgroundColor: '#FAFAFA'}}>
            <h3 className="text-xl font-semibold text-center text-deep-saffron-500 mb-4 pb-2 border-b-2 border-deep-saffron-200 font-serif">ELD Log Preview</h3>
            <ELDLog
            events={events}
            metadata={eldMetadata}
            />
        </div>
      )}
    </div>
  );
}
