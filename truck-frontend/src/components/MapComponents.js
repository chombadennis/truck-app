import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  FeatureGroup
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

const Legend = () => {
    const map = useMap();
  
    React.useEffect(() => {
      const legend = L.control({ position: "bottomright" });
  
      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
            <h4>Legend</h4>
            <div><img src="https://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="start" /> Start</div>
            <div><img src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="pickup" /> Pickup</div>
            <div><img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="dropoff" /> Dropoff</div>
            <div><div class="route-line"></div> Route</div>
        `;
        return div;
      };
  
      legend.addTo(map);
  
      return () => {
        legend.remove();
      };
    }, [map]);
  
    return null;
  };

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

  return (
    <MapContainer
      style={{ height: 800, width: "100%" }}
      center={[39.5, -98.35]}
      zoom={4}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FeatureGroup>
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.coord.lat, m.coord.lng]} icon={m.icon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="blue" />
        )}
      </FeatureGroup>
      <Legend />
    </MapContainer>
  );
}