
import React, { useState, useEffect } from "react";
import GeoSearchField from "./GeoSearchField";
import axios from "axios"; // <-- Import axios for API calls

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
  const now = getLocalDateTimeString(new Date());

  // Form state
  const [startCoords, setStartCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [startTime, setStartTime] = useState(now);

  // --- NEW: State for rules ---
  const [rules, setRules] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState("");

  // ELD Metadata state
  const [driverName, setDriverName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [mainOffice, setMainOffice] = useState("");
  const [shippingDocs, setShippingDocs] = useState("");
  const [coDriver, setCoDriver] = useState("");

  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);
  const [errors, setErrors] = useState({});

  // --- NEW: Fetch rules on component mount ---
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get("/api/rules/");
        setRules(response.data);
        // Set a default selection if rules are loaded
        if (response.data.length > 0) {
          setSelectedRuleId(response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching HOS rules:", error);
      }
    };
    fetchRules();
  }, []); // The empty dependency array ensures this runs only once on mount.

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

  const validateForm = () => {
    const newErrors = {};
    if (!startCoords) newErrors.startCoords = true;
    if (!pickupCoords) newErrors.pickupCoords = true;
    if (!dropoffCoords) newErrors.dropoffCoords = true;
    if (!driverName) newErrors.driverName = true;
    if (!vehicleId) newErrors.vehicleId = true;
    if (!carrier) newErrors.carrier = true;
    if (!mainOffice) newErrors.mainOffice = true;
    if (!shippingDocs) newErrors.shippingDocs = true;
    if (!selectedRuleId) newErrors.selectedRuleId = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const selectedRule = rules.find(rule => rule.id === parseInt(selectedRuleId, 10));
    const hosRuleName = selectedRule ? `${selectedRule.name} - ${selectedRule.cycle_type}` : null;

    const payload = {
      // Trip details
      start_coords: startCoords ? [startCoords.lon, startCoords.lat] : null,
      pickup_coords: pickupCoords ? [pickupCoords.lon, pickupCoords.lat] : null,
      dropoff_coords: dropoffCoords ? [dropoffCoords.lon, dropoffCoords.lat] : null,
      start_time: new Date(startTime).toISOString(),
      
      regional_rule_id: parseInt(selectedRuleId, 10),

      // ELD metadata
      metadata: {
        driverName,
        vehicleId,
        carrier,
        homeTerminal: mainOffice,
        shippingDocs,
        coDriver,
        hosRule: hosRuleName,
      }
    };
    onPlan(payload);
  };

  return (
    <form className="space-y-8" onSubmit={submit} noValidate>
      <h3 className="text-2xl font-extrabold text-center text-deep-saffron-600 tracking-tight font-serif">Plan Your Trip</h3>

      <div className="p-6 bg-gradient-to-br from-amber-flame-50 to-amber-flame-100 rounded-2xl shadow-lg border-t-4 border-amber-flame-500">
        <h3 className="text-xl font-bold text-cayenne-red-700 mb-5 pb-2 border-b-2 border-cayenne-red-200 font-serif">Route</h3>
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Start Location*</label>
                <GeoSearchField onLocationSelect={setStartCoords} placeholder="Enter start location..." hasError={errors.startCoords} />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Pickup Location*</label>
                <GeoSearchField onLocationSelect={setPickupCoords} placeholder="Enter pickup location..." hasError={errors.pickupCoords} />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Dropoff Location*</label>
                <GeoSearchField onLocationSelect={setDropoffCoords} placeholder="Enter dropoff location..." hasError={errors.dropoffCoords} />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Start Time</label>
                <input
                    className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.startTime ? 'border-red-500' : 'border-orange-200'}`}
                    type="datetime-local"
                    value={startTime}
                    min={now}
                    onChange={(e) => setStartTime(e.target.value)}
                />
            </div>
        </div>
      </div>
      
      <div className="p-6 bg-gradient-to-br from-deep-saffron-50 to-deep-saffron-100 rounded-2xl shadow-lg border-t-4 border-deep-saffron-500">
        <h3 className="text-xl font-bold text-orange-700 mb-5 pb-2 border-b-2 border-orange-200 font-serif">Compliance Rules</h3>
        <div>
          <label className="block text-sm font-semibold text-deep-saffron-800 mb-1">Regional HOS Rule*</label>
          <select
            className={`w-full p-3 text-base text-deep-saffron-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 appearance-none ${errors.selectedRuleId ? 'border-red-500' : 'border-deep-saffron-200'}`}
            value={selectedRuleId}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            required
          >
            <option value="" disabled>Select a rule...</option>
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name} - {rule.cycle_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border-t-4 border-orange-500">
        <h3 className="text-xl font-bold text-amber-flame-700 mb-5 pb-2 border-b-2 border-amber-flame-200 font-serif">ELD Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Driver Name*</label>
                <input className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.driverName ? 'border-red-500' : 'border-orange-200'}`} type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="e.g., John Doe" required />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Vehicle No.*</label>
                <input className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.vehicleId ? 'border-red-500' : 'border-orange-200'}`} type="text" value={vehicleId} onChange={e => setVehicleId(e.target.value)} placeholder="e.g., TRK-501" required />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Carrier*</label>
                <input className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.carrier ? 'border-red-500' : 'border-orange-200'}`} type="text" value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g., Swift Logistics" required />
            </div>
            <div>
                <label className="block text-sm font-semibold text-orange-800 mb-1">Main Office*</label>
                <input className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.mainOffice ? 'border-red-500' : 'border-orange-200'}`} type="text" value={mainOffice} onChange={e => setMainOffice(e.target.value)} placeholder="e.g., Phoenix, AZ" required />
            </div>
        </div>
        <div className="mt-5">
            <label className="block text-sm font-semibold text-orange-800 mb-1">Shipping Docs*</label>
            <input className={`w-full p-3 text-base text-orange-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300 ${errors.shippingDocs ? 'border-red-500' : 'border-orange-200'}`} type="text" value={shippingDocs} onChange={e => setShippingDocs(e.target.value)} placeholder="e.g., BOL #12345, PO #67890" required />
        </div>
        <div className="mt-5">
            <label className="block text-sm font-semibold text-orange-800 mb-1">Co-Driver (Optional)</label>
            <input className="w-full p-3 text-base text-orange-900 bg-white border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-flame-300 focus:border-amber-flame-500 transition duration-300" type="text" value={coDriver} onChange={e => setCoDriver(e.target.value)} placeholder="e.g., Jane Smith" />
        </div>
      </div>

      <div className="text-center">
        <button className="py-3 px-16 text-xl font-serif font-bold rounded-lg mt-6 transition-all duration-300 ease-in-out bg-cayenne-red-600 text-white hover:bg-cayenne-red-500 focus:outline-none focus:ring-4 focus:ring-amber-flame-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105" type="submit" disabled={isLoading}>
            {isLoading ? <span className="animate-pulse">Loading...</span> : "🚚 Plan Trip"}
        </button>
      </div>
      {showLoadingMessage && <p className="text-center italic text-orange-600 mt-3 h-5">{loadingMessage}</p>}
    </form>
  );
}
