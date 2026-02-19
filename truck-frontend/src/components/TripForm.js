import React, { useState } from "react";
import "./TripForm.css"; // new CSS for styling

export default function TripForm({ onPlan }) {
  const [driverId, setDriverId] = useState(1);
  const [startLat, setStartLat] = useState("");
  const [startLng, setStartLng] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [dropoffLat, setDropoffLat] = useState("");
  const [dropoffLng, setDropoffLng] = useState("");
  const [startTime, setStartTime] = useState(new Date().toISOString());

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      driver_id: parseInt(driverId, 10),
      start_coords:
        startLat !== "" && startLng !== ""
          ? [parseFloat(startLng), parseFloat(startLat)]
          : null,
      pickup_coords:
        pickupLat !== "" && pickupLng !== ""
          ? [parseFloat(pickupLng), parseFloat(pickupLat)]
          : null,
      dropoff_coords:
        dropoffLat !== "" && dropoffLng !== ""
          ? [parseFloat(dropoffLng), parseFloat(dropoffLat)]
          : null,
      start_time: startTime,
      cycle_type: "70/8",
      driven_today_minutes: 0,
      on_duty_today_minutes: 0,
      rolling_history: [],
    };
    onPlan(payload);
  };

  return (
    <form className="trip-form" onSubmit={submit}>
      <h2 className="form-title">Plan Your Trip</h2>

      <div className="form-row">
        <label>Driver ID</label>
        <input
          type="number"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        />
      </div>

      <h3 className="section-title">Start Location</h3>
      <div className="form-grid">
        <div>
          <label>Latitude</label>
          <input
            type="number"
            placeholder="30.2672"
            value={startLat}
            onChange={(e) => setStartLat(e.target.value)}
          />
        </div>
        <div>
          <label>Longitude</label>
          <input
            type="number"
            placeholder="-97.7431"
            value={startLng}
            onChange={(e) => setStartLng(e.target.value)}
          />
        </div>
      </div>

      <h3 className="section-title">Pickup Location</h3>
      <div className="form-grid">
        <div>
          <label>Latitude</label>
          <input
            type="number"
            placeholder="29.7604"
            value={pickupLat}
            onChange={(e) => setPickupLat(e.target.value)}
          />
        </div>
        <div>
          <label>Longitude</label>
          <input
            type="number"
            placeholder="-95.3698"
            value={pickupLng}
            onChange={(e) => setPickupLng(e.target.value)}
          />
        </div>
      </div>

      <h3 className="section-title">Dropoff Location</h3>
      <div className="form-grid">
        <div>
          <label>Latitude</label>
          <input
            type="number"
            placeholder="32.7767"
            value={dropoffLat}
            onChange={(e) => setDropoffLat(e.target.value)}
          />
        </div>
        <div>
          <label>Longitude</label>
          <input
            type="number"
            placeholder="-96.7970"
            value={dropoffLng}
            onChange={(e) => setDropoffLng(e.target.value)}
          />
        </div>
      </div>

      <h3 className="section-title">Trip Details</h3>
      <div className="form-row">
        <label>Start time (ISO)</label>
        <input
          type="datetime-local"
          value={startTime.slice(0, 16)}
          onChange={(e) => setStartTime(new Date(e.target.value).toISOString())}
        />
      </div>

      <button className="submit-btn" type="submit">
        🚚 Plan Trip
      </button>
    </form>
  );
}
