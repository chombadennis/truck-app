import React, { useState, useEffect } from "react";
import GeoSearchField from "./GeoSearchField";
import "./TripForm.css";

const getLocalDateTimeString = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const loadingMessages = [
  "Calculating the best route...",
  "Generating compliance report...",
  "Checking traffic conditions...",
  "Finding fuel stops...",
  "Planning breaks...",
];

export default function TripForm({ onPlan, isLoading }) {
  // Get the current time once, formatted for the datetime-local input.
  const now = getLocalDateTimeString(new Date());

  // Form state
  const [startCoords, setStartCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [startTime, setStartTime] = useState(now);

  // ELD Metadata state
  const [driverName, setDriverName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [mainOffice, setMainOffice] = useState("");
  const [shippingDocs, setShippingDocs] = useState("");
  const [coDriver, setCoDriver] = useState("");

  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  useEffect(() => {
    let messageTimer, showMessageTimer;
    if (isLoading) {
      showMessageTimer = setTimeout(() => {
        setShowLoadingMessage(true);
      }, 3000);
      messageTimer = setInterval(() => {
        setLoadingMessage(
          loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
        );
      }, 2000);
    } else {
      setShowLoadingMessage(false);
    }
    return () => {
      clearTimeout(showMessageTimer);
      clearInterval(messageTimer);
    };
  }, [isLoading]);

  const submit = (e) => {
    e.preventDefault();

    // --- Form Validation ---
    if (!startCoords || !pickupCoords || !dropoffCoords) {
      alert("Please select a Start, Pickup, and Dropoff location.");
      return;
    }
    if (!driverName || !vehicleId || !carrier || !mainOffice || !shippingDocs) {
      alert("Please fill in all required ELD Information fields (*).");
      return;
    }

    const payload = {
      // Trip details
      start_coords: startCoords ? [startCoords.lon, startCoords.lat] : null,
      pickup_coords: pickupCoords ? [pickupCoords.lon, pickupCoords.lat] : null,
      dropoff_coords: dropoffCoords ? [dropoffCoords.lon, dropoffCoords.lat] : null,
      start_time: new Date(startTime).toISOString(),
      
      // HOS context
      cycle_type: "70/8",
      driven_today_minutes: 0,
      on_duty_today_minutes: 0,
      rolling_history: [],

      // ELD metadata
      metadata: {
        driverName,
        vehicleId,
        carrier,
        homeTerminal: mainOffice,
        shippingDocs,
        coDriver,
      }
    };
    onPlan(payload);
  };

  return (
    <form className="trip-form" onSubmit={submit}>
      <h3 className="section-header">Plan Your Trip</h3>

      <div className="form-section">
        <h3 className="section-title">Route</h3>
        <div className="form-row">
            <label>Start Location*</label>
            <GeoSearchField onLocationSelect={setStartCoords} placeholder="Enter start location..."/>
        </div>
        <div className="form-row">
            <label>Pickup Location*</label>
            <GeoSearchField onLocationSelect={setPickupCoords} placeholder="Enter pickup location..."/>
        </div>
        <div className="form-row">
            <label>Dropoff Location*</label>
            <GeoSearchField onLocationSelect={setDropoffCoords} placeholder="Enter dropoff location..."/>
        </div>
        <div className="form-row">
            <label>Start Time</label>
            <input
                type="datetime-local"
                value={startTime}
                min={now} // This prevents selecting past dates and times
                onChange={(e) => setStartTime(e.target.value)}
            />
        </div>
      </div>
      
      <div className="form-section">
        <h3 className="section-title">ELD Information</h3>
        <div className="grid-2-col">
            <div className="form-row">
                <label>Driver Name*</label>
                <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="e.g., John Doe" required />
            </div>
            <div className="form-row">
                <label>Vehicle No.*</label>
                <input type="text" value={vehicleId} onChange={e => setVehicleId(e.target.value)} placeholder="e.g., TRK-501" required />
            </div>
            <div className="form-row">
                <label>Carrier*</label>
                <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g., Swift Logistics" required />
            </div>
            <div className="form-row">
                <label>Main Office*</label>
                <input type="text" value={mainOffice} onChange={e => setMainOffice(e.target.value)} placeholder="e.g., Phoenix, AZ" required />
            </div>
        </div>
        <div className="form-row">
            <label>Shipping Docs*</label>
            <input type="text" value={shippingDocs} onChange={e => setShippingDocs(e.target.value)} placeholder="e.g., BOL #12345, PO #67890" required />
        </div>
        <div className="form-row">
            <label>Co-Driver (Optional)</label>
            <input type="text" value={coDriver} onChange={e => setCoDriver(e.target.value)} placeholder="e.g., Jane Smith" />
        </div>
      </div>

      <button className={`submit-btn ${isLoading ? 'loading' : ''}`} type="submit" disabled={isLoading}>
        {isLoading ? <span className="loading-text">Loading<span className="dots">...</span></span> : "🚚 Plan Trip"}
      </button>
      {showLoadingMessage && <p className="loading-message">{loadingMessage}</p>}
    </form>
  );
}
