import React, { useMemo, useState } from "react";
import { downloadEldAsPdf } from "../utils/pdfDownloader";

// A more professional and complete ELD Log component that closer resembles a paper log.

/**
 * Props:
 *  - events: [{status, timestamp (ISO), duration_minutes, miles?, location?, note?}, ...]
 *  - metadata: { driverName, vehicleId, carrier, homeTerminal, coDriver?, shippingDocs?, hosRule? }
 */
export default function ELDLog({ events = [], metadata = {} }) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Memoized calculation to split events by local calendar day.
  const dayBuckets = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    // Helper to split a single event if it crosses midnight.
    function splitEvent(ev) {
      const start = new Date(ev.timestamp);
      const duration = Number(ev.duration_minutes || 0);
      if (!(duration > 0)) return [];
      const end = new Date(start.getTime() + duration * 60000);
      const segs = [];
      let segStart = new Date(start);

      while (segStart < end) {
        const midnight = new Date(segStart);
        midnight.setHours(24, 0, 0, 0);
        const segEnd = end < midnight ? end : midnight;
        const segDurMin = Math.round((segEnd - segStart) / 60000);
        
        if (segDurMin > 0) { // Only add segments with a duration
          segs.push({
            ...ev,
            timestamp: segStart.toISOString(),
            duration_minutes: segDurMin,
          });
        }
        segStart = new Date(segEnd);
      }
      return segs;
    }

    const buckets = {};
    events.forEach((ev) => {
      const parts = splitEvent(ev);
      parts.forEach((p) => {
        const d = new Date(p.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(p);
      });
    });

    Object.keys(buckets).forEach((k) =>
      buckets[k].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    );
    
    return Object.keys(buckets).sort().map((k) => ({ dateKey: k, events: buckets[k] }));
  }, [events]);

  // Main rendering function for a single log sheet.
  function renderSheet(day, dayIndex) {
    const { dateKey, events: dayEvents } = day;

    // --- Layout and Constants ---
    const pixelsPerHour = 38;
    const hours = 24;
    const svgWidth = pixelsPerHour * hours;
    const headerHeight = 30; 
    const rowHeight = 22;
    const rows = [
      { key: "OFF", label: "Off Duty" },
      { key: "SLEEPER", label: "Sleeper Berth" },
      { key: "DRIVE", label: "Driving" },
      { key: "ON", label: "On Duty (Not Driving)" },
    ];
    const svgHeight = rowHeight * rows.length;
    const statusLabelWidth = 120; 
    const totalsWidth = 80;

    // --- Data Processing for Rendering ---
    const totalMiles = (dayEvents.reduce((s, e) => s + (Number(e.miles) || 0), 0) || 0).toFixed(1);
    
    function minutesSinceMidnightLocal(ts) {
        const d = new Date(ts);
        return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    }

    // Create a minute-by-minute timeline for accurate visualization and calculation.
    const minutesInDay = 24 * 60;
    const timeline = Array(minutesInDay).fill("OFF");
    dayEvents.forEach(ev => {
      const startMin = Math.floor(minutesSinceMidnightLocal(ev.timestamp));
      const dur = Number(ev.duration_minutes || 0);
      const endMin = Math.min(startMin + dur, minutesInDay);
      for (let i = startMin; i < endMin; i++) {
        timeline[i] = ev.status;
      }
    });

    // Calculate total minutes for each status.
    const totalMinutesPerStatus = { OFF: 0, SLEEPER: 0, DRIVE: 0, ON: 0 };
    timeline.forEach(status => {
      if (totalMinutesPerStatus[status] !== undefined) {
        totalMinutesPerStatus[status]++;
      }
    });

    // Generate the SVG path data for the log line.
    const statusToY = {};
    rows.forEach((r, idx) => { statusToY[r.key] = idx * rowHeight + rowHeight / 2; });
    statusToY['default'] = 0 * rowHeight + rowHeight / 2;

    let pathData = "";
    if (timeline.length > 0) {
      const startY = statusToY[timeline[0]] || statusToY['default'];
      pathData = `M 0,${startY}`;
      for (let i = 1; i < minutesInDay; i++) {
        if (timeline[i] !== timeline[i - 1]) {
          const prevY = statusToY[timeline[i - 1]] || statusToY['default'];
          const currY = statusToY[timeline[i]] || statusToY['default'];
          const x = (i / 60) * pixelsPerHour;
          pathData += ` L ${x},${prevY} L ${x},${currY}`;
        }
      }
      const endY = statusToY[timeline[minutesInDay - 1]] || statusToY['default'];
      pathData += ` L ${svgWidth},${endY}`;
    }

    const onDutyHoursToday = ((totalMinutesPerStatus.DRIVE + totalMinutesPerStatus.ON) / 60).toFixed(2);

    // Mock recap data
    const prevDaysOnDuty = (dayIndex * 4.5);
    const totalLast7 = (prevDaysOnDuty + Number(onDutyHoursToday)).toFixed(2);
    const availableTomorrow = (70 - totalLast7).toFixed(2);

    return (
      <div id={`log-sheet-${dateKey}`} key={dateKey} style={{ marginBottom: 20, fontFamily: "'Arial', sans-serif", fontSize: 12, border: '1.5px solid #333', color: '#1A202C', backgroundColor: 'white' }}>
        
        {/* --- Header Section --- */}
        <div style={{ padding: 8, borderBottom: '1.5px solid #333', background: '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flexGrow: 1, marginRight: '1rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {`Driver's Daily Log - ${metadata.hosRule || 'N/A'}`}
                    </span>
                </div>
                <div>
                    <span>Date: </span>
                    <span style={{ minWidth: 100, borderBottom: '1px solid #333', padding: '0 8px' }}>{dateKey}</span>
                </div>
            </div>
        </div>

        {/* --- Log Grid Section --- */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid #333' }}>
            {/* Status Labels - Correctly Aligned */}
            <div style={{ width: statusLabelWidth, background: '#f0f0f0', borderRight: '1.5px solid #333' }}>
                <div style={{ height: headerHeight, display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>Status</div>
                {rows.map(r => (
                    <div key={r.key} style={{ height: rowHeight, padding: '0 8px', display: 'flex', alignItems: 'center', borderTop: '1px solid #ddd' }}>
                        {r.label}
                    </div>
                ))}
            </div>

            {/* SVG Grid with restored fixed-width rendering */}
            <div style={{ width: svgWidth, overflowX: 'scroll' }}>
                <svg width={svgWidth} height={svgHeight + headerHeight} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                    {/* Header with hour numbers AND time-of-day labels */}
                    <g>
                        {/* Time-of-day contextual labels */}
                        <text x={pixelsPerHour * 6} y={12} fontSize={10} textAnchor="middle" fill="#555">Morning</text>
                        <text x={pixelsPerHour * 12} y={12} fontSize={10} textAnchor="middle" fill="#555">Noon</text>
                        <text x={pixelsPerHour * 18} y={12} fontSize={10} textAnchor="middle" fill="#555">Evening</text>

                        {/* Hour numbers and tick marks */}
                        {Array.from({ length: hours + 1 }).map((_, i) => (
                            <g key={i}>
                                {i < 24 && <text x={i * pixelsPerHour + 2} y={headerHeight - 4} fontSize={10}>{i}</text>}
                                <line x1={i * pixelsPerHour} y1={headerHeight - 8} x2={i * pixelsPerHour} y2={headerHeight} stroke="#ccc" strokeWidth={1} />
                            </g>
                        ))}
                    </g>

                    {/* Grid content */}
                    <g transform={`translate(0, ${headerHeight})`}>
                        {rows.map((r, i) => <line key={i} x1={0} y1={i * rowHeight} x2={svgWidth} y2={i * rowHeight} stroke="#ddd" strokeWidth={1} /> )}
                        {Array.from({ length: hours }).map((_, i) => <line key={i} x1={i * pixelsPerHour} y1={0} x2={i * pixelsPerHour} y2={svgHeight} stroke={i % 3 === 0 ? "#bbb" : "#ddd"} strokeWidth={1} /> )}
                        <path d={pathData} fill="none" stroke="#0056b3" strokeWidth={2.5} strokeLinecap="round" />
                    </g>
                </svg>
            </div>

            {/* Totals Column */}
            <div style={{ width: totalsWidth, borderLeft: '1.5px solid #333', background: '#f0f0f0' }}>
                <div style={{fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc', height: headerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Total Hrs</div>
                {rows.map(r => (
                    <div key={r.key} style={{ height: rowHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #ddd'}}>
                        <strong>{(totalMinutesPerStatus[r.key] / 60).toFixed(2)}</strong>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Remarks / Details Section --- */}
        <div style={{ borderBottom: '1.5px solid #333', padding: 8 }}>
            <strong>Remarks / Change of Duty Status:</strong>
            <div className="remarks-section" style={{ marginTop: 4, height: 80, overflowY: 'auto', border: '1px solid #ccc', padding: 4 }}>
                 {dayEvents.map((ev, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #eee', padding: '2px 0'}}>
                    {`[${new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]`}
                    {` - Event: `}<strong>{ev.status}</strong>
                    {ev.location && `, At: ${ev.location}`}
                    {ev.note && ` (Note: ${ev.note})`}
                  </div>
                ))}
                {dayEvents.length === 0 && <span style={{color: '#4A5568'}}>No duty status changes recorded for this day.</span>}
            </div>
        </div>

        {/* --- Recap Section --- */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 8, borderBottom: '1.5px solid #333', background: '#f0f0f0' }}>
            <RecapItem label="On Duty Hours Today" value={onDutyHoursToday} />
            <RecapItem label="Total On Duty (Last 7 Days)" value={totalLast7} />
            <RecapItem label="Hours Available Tomorrow (70hr)" value={availableTomorrow > 0 ? availableTomorrow : '0.00'} />
        </div>

        {/* --- Footer Section --- */}
        <div style={{ padding: 8 }}>
            <FooterRow>
                <FooterItem label="Total Miles Driving Today" value={totalMiles} />
                <FooterItem label="Truck/Tractor No." value={metadata.vehicleId} />
            </FooterRow>
            <FooterRow>
                <FooterItem label="Carrier" value={metadata.carrier} />
                <FooterItem label="Main Office Address" value={metadata.homeTerminal} />
            </FooterRow>
            <FooterRow>
                <FooterItem label="Driver Signature" value={metadata.driverName} />
                <FooterItem label="Co-Driver" value={metadata.coDriver} />
            </FooterRow>
             <FooterRow>
                <FooterItem label="Shipping Documents" value={metadata.shippingDocs} />
            </FooterRow>
        </div>

      </div>
    );
  }

  // --- Helper sub-components for styling ---
  const RecapItem = ({ label, value }) => (
      <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#4A5568' }}>{label}</div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>{value || '—'}</div>
      </div>
  );

  const FooterRow = ({ children }) => <div style={{ display: 'flex', borderTop: '1px solid #eee', padding: '4px 0' }}>{children}</div>;

  const FooterItem = ({ label, value }) => (
      <div style={{ flex: 1 }}>
          <span style={{ color: '#4A5568' }}>{label}: </span>
          <strong style={{ borderBottom: '1px dotted #333', padding: '0 4px' }}>{value || '—'}</strong>
      </div>
  );

  const handleDownload = async () => {
    // This guard prevents the function from running if there's nothing to download.
    if (dayBuckets.length === 0) return;

    setIsDownloading(true);
    try {
      await downloadEldAsPdf(dayBuckets, metadata);
    } catch (error) {
      console.error("PDF download failed unexpectedly:", error);
      alert("Could not complete the PDF download. Please check the console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Base style for the button
  const buttonStyle = {
    backgroundColor: '#DD6B20',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s, opacity 0.3s',
  };

  // Style for the button when it's disabled
  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#a0aec0', // A more muted color
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  // --- Component Return ---
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, overflowX: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button 
              style={(isDownloading || dayBuckets.length === 0) ? disabledButtonStyle : buttonStyle}
              onClick={handleDownload}
              disabled={isDownloading || dayBuckets.length === 0}
          >
              {isDownloading ? "Downloading..." : "Download as PDF"}
          </button>
      </div>

      {dayBuckets.length === 0 ? (
        <div style={{ color: "#4A5568", textAlign: 'center', padding: 40, border: '1px dashed #ccc', backgroundColor: '#fafafa' }}>
            No ELD events found. Plan a trip to generate a log.
        </div>
      ) : (
        dayBuckets.map((d, i) => renderSheet(d, i))
      )}
    </div>
  );
}
