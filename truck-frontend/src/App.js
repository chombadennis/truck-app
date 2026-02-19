import React, { useState } from "react";
import TripForm from "./components/TripForm";
import MapComponent from "./components/MapComponents";
import ELDLog from "./components/ELDLog";
import axios from "axios";

export function generateELDEvents(
  events = [],
  totalDistance = 0,
  pickupTime = null,
  dropoffTime = null
) {
  const result = [];

  if (pickupTime) {
    result.push({
      status: "ON",
      timestamp: new Date(pickupTime).toISOString(),
      duration_minutes: 60,
      note: "Pickup",
      miles: 0,
    });
  }

  let lastMiles = 0;
  let lastTimestamp = pickupTime ? new Date(pickupTime) : new Date();
  for (let ev of events) {
    const deltaMiles = Number(ev.miles || 0);
    lastMiles += deltaMiles;

    const currentTimestamp = new Date(ev.timestamp);
    result.push({
      ...ev,
      miles: deltaMiles,
      timestamp: currentTimestamp.toISOString(),
    });

    const fuelInterval = 1000;
    while (lastMiles >= fuelInterval) {
      lastTimestamp = new Date(lastTimestamp.getTime() + 30 * 60000);
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

  if (dropoffTime) {
    result.push({
      status: "ON",
      timestamp: new Date(dropoffTime).toISOString(),
      duration_minutes: 60,
      note: "Dropoff",
      miles: 0,
    });
  }

  return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export default function App() {
  const [routeGeo, setRouteGeo] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [startCoords, setStartCoords] = useState({ lat: "", lng: "" });
  const [pickupCoords, setPickupCoords] = useState({ lat: "", lng: "" });
  const [dropoffCoords, setDropoffCoords] = useState({ lat: "", lng: "" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handlePlan = async (payload) => {
    try {
      const res = await axios.post(`${API_URL}/api/plan-trip/`, payload);
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
      const enhancedEvents = generateELDEvents(
        rawEvents,
        res.data.summary?.total_distance || 0,
        payload.pickup_time || null,
        payload.dropoff_time || null
      );
      setEvents(enhancedEvents);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error("Plan trip error", err.response?.data || err.message);
      alert("Error planning trip. Check console.");
    }
  };

  const containerStyle = {
    fontFamily: "'Inter', Arial, sans-serif",
    background: "#f4f6f8",
    minHeight: "100vh",
    padding: 24,
    color: "#2c3e50",
  };

  const cardStyle = {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: 24,
  };

  const sectionHeaderStyle = {
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: 8,
    marginBottom: 16,
    color: "#34495e",
  };

  const preStyle = {
    background: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    overflowX: "auto",
    fontSize: 14,
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: 32, color: "#1f3c88" }}>
        Truck HOS Planner — Demo
      </h1>

      <div style={cardStyle}>
        <TripForm onPlan={handlePlan} />
      </div>

      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>Route Map & Coordinates</h3>
        <MapComponent
          routeGeojson={routeGeo}
          start={startCoords}
          pickup={pickupCoords}
          dropoff={dropoffCoords}
        />
      </div>

      {summary && (
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Trip Summary</h3>
          <pre style={preStyle}>{JSON.stringify(summary, null, 2)}</pre>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>Events (Raw JSON)</h3>
        <pre style={preStyle}>{JSON.stringify(events, null, 2)}</pre>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>ELD Log Preview</h3>
        <ELDLog
          events={events}
          metadata={{
            driverName: "Dennis Test",
            vehicleId: "TRUCK-123",
            carrier: "My Carrier Ltd.",
            totalMiles: (
              events.reduce((s, e) => s + (e.miles || 0), 0) || 0
            ).toFixed(2),
          }}
        />
      </div>
    </div>
  );
}
