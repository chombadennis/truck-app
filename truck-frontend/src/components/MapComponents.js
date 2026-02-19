import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng)
      map.setView([center.lat, center.lng], 6);
  }, [center, map]);
  return null;
}

export default function MapComponent({ routeGeojson, start, pickup, dropoff }) {
  const markers = [
    { coord: start, label: "Start", icon: greenIcon },
    { coord: pickup, label: "Pickup", icon: blueIcon },
    { coord: dropoff, label: "Dropoff", icon: redIcon },
  ].filter((m) => m.coord && m.coord.lat !== "" && m.coord.lng !== "");

  const polylinePositions =
    routeGeojson && routeGeojson.coordinates
      ? routeGeojson.coordinates.map(([lng, lat]) => [lat, lng])
      : [];

  const legendStyle = {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.65)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  const legendItemStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
  };
  
  const legendTitleStyle = {
      margin: '0 0 10px 0',
      fontWeight: 'bold',
      borderBottom: '1px solid #eee',
      paddingBottom: '5px'
  }

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        style={{ height: 800, width: "100%" }}
        center={[39.5, -98.35]}
        zoom={4}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.coord.lat, m.coord.lng]} icon={m.icon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="blue" />
        )}
        <MapUpdater center={markers[0]?.coord} />
      </MapContainer>
      <div style={legendStyle}>
        <h4 style={legendTitleStyle}>Legend</h4>
        <div style={legendItemStyle}>
          <img
            src="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            alt="start"
            style={{ width: 20, marginRight: 5 }}
          />
          Start
        </div>
        <div style={legendItemStyle}>
          <img
            src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            alt="pickup"
            style={{ width: 20, marginRight: 5 }}
          />
          Pickup
        </div>
        <div style={legendItemStyle}>
          <img
            src="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            alt="dropoff"
            style={{ width: 20, marginRight: 5 }}
          />
          Dropoff
        </div>
         <div style={legendItemStyle}>
          <div style={{width: 20, height: 3, backgroundColor: 'blue', marginRight: 5}} />
          Route
        </div>
      </div>
    </div>
  );
}