// src/components/ELDLog.js
import React, { useRef, useMemo, useState } from "react";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";

/**
 * Props:
 *  - events: [{status, timestamp (ISO), duration_minutes, miles?, location?, note?}, ...]
 *  - metadata: { driverName, vehicleId, carrier }
 *  - defaultPixelsPerHour: number (default = 60)
 */
export default function ELDLog({
  events = [],
  metadata = {},
  defaultPixelsPerHour = 60,
}) {
  const wrappersRef = useRef([]); // to capture all day nodes
  const [pixelsPerHour, setPixelsPerHour] = useState(defaultPixelsPerHour);

  // Split and bucket events per local calendar day, splitting cross-midnight events
  const dayBuckets = useMemo(() => {
    if (!events || events.length === 0) return [];
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
        segs.push({
          ...ev,
          timestamp: segStart.toISOString(),
          duration_minutes: segDurMin,
        });
        segStart = new Date(segEnd);
      }
      return segs;
    }
    const buckets = {};
    events.forEach((ev) => {
      const parts = splitEvent(ev);
      parts.forEach((p) => {
        const d = new Date(p.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(p);
      });
    });
    Object.keys(buckets).forEach((k) =>
      buckets[k].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    );
    return Object.keys(buckets)
      .sort()
      .map((k) => ({ dateKey: k, events: buckets[k] }));
  }, [events]);

  // Layout constants
  const hours = 24;
  const hourWidth = pixelsPerHour; // px per hour
  const svgPadding = 12;
  const headerHeight = 64;
  const rowHeight = 34;
  const rowGap = 8;
  const rows = [
    { key: "OFF", label: "Off Duty" },
    { key: "SLEEPER", label: "Sleeper" },
    { key: "DRIVE", label: "Driving" },
    { key: "ON", label: "On Duty (Not Driving)" },
  ];
  const svgHeight =
    headerHeight + rows.length * (rowHeight + rowGap) + svgPadding * 2;
  const statusColor = {
    OFF: "#8ec07c",
    SLEEPER: "#7aa2f7",
    DRIVE: "#e06c75",
    ON: "#f0c674",
  };
  const qualifyingBreakColor = "#ffb347"; // highlight color for qualifying breaks

  function minutesSinceMidnightLocal(ts) {
    const d = new Date(ts);
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function renderSheet(day, idx) {
    const { dateKey, events: dayEvents } = day;
    const svgWidth = hourWidth * hours;
    const totalMiles = (
      dayEvents.reduce((s, e) => s + (Number(e.miles) || 0), 0) || 0
    ).toFixed(2);

    // per-row rectangles
    const rowRects = rows.map((r, rowIdx) => {
      const rects = [];
      dayEvents.forEach((ev) => {
        if (ev.status !== r.key) return;
        const startMin = minutesSinceMidnightLocal(ev.timestamp);
        const dur = Number(ev.duration_minutes || 0);
        const x = (startMin / 60) * hourWidth;
        const w = Math.max(1, (dur / 60) * hourWidth);

        // if qualifying break → override color
        const color = ev.qualifying_break
          ? qualifyingBreakColor
          : statusColor[ev.status] || "#999";

        rects.push({
          x,
          y: headerHeight + svgPadding + rowIdx * (rowHeight + rowGap),
          width: w,
          height: rowHeight,
          color,
          event: ev,
        });
      });
      return rects;
    });

    return (
      <div key={dateKey} style={{ marginBottom: 18 }}>
        {/* Header with metadata */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div>
            <strong>Date:</strong> {dateKey} &nbsp;|&nbsp;{" "}
            <strong>Driver:</strong> {metadata.driverName || "—"}
          </div>
          <div>
            <strong>Total miles:</strong> {totalMiles} &nbsp;|&nbsp;{" "}
            <strong>Vehicle:</strong> {metadata.vehicleId || "—"}
          </div>
        </div>

        {/* Remarks block */}
        <div style={{ marginBottom: 6, color: "#333", fontSize: 12 }}>
          <strong>Remarks:</strong>
          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
            {dayEvents.map((ev, i) => (
              <li
                key={i}
                style={{
                  listStyle: "disc",
                  marginBottom: 4,
                  fontWeight: ev.qualifying_break ? "bold" : "normal",
                  color: ev.qualifying_break ? "#d35400" : "#333", // highlight
                }}
              >
                {new Date(ev.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — {ev.status} — {ev.location || ev.note || ""}
                {ev.qualifying_break && " ⚡"} {/* optional icon */}
              </li>
            ))}
          </ul>
        </div>

        {/* Graph wrapper */}
        <div
          ref={(el) => (wrappersRef.current[idx] = el)}
          style={{
            border: "1px solid #ddd",
            padding: 8,
            background: "#fff",
            overflowX: "auto",
            width: "100%",
          }}
        >
          <div style={{ width: svgWidth + svgPadding * 2 }}>
            <svg
              width={svgWidth + svgPadding * 2}
              height={svgHeight}
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x={0}
                y={0}
                width={svgWidth + svgPadding * 2}
                height={svgHeight}
                fill="#fff"
              />

              <text
                x={svgPadding}
                y={20}
                fontSize={14}
                fontFamily="Arial, Helvetica, sans-serif"
              >
                ELD Daily Log — {dateKey}
              </text>
              <text
                x={svgPadding}
                y={40}
                fontSize={12}
                fontFamily="Arial, Helvetica, sans-serif"
              >
                {metadata.driverName ? `Driver: ${metadata.driverName}` : ""}
              </text>

              <g transform={`translate(${svgPadding}, ${headerHeight})`}>
                {/* vertical hour lines and labels */}
                {Array.from({ length: hours + 1 }).map((_, i) => {
                  const x = i * hourWidth;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        y1={-headerHeight + 8}
                        x2={x}
                        y2={rows.length * (rowHeight + rowGap) + 24}
                        stroke="#e9e9e9"
                        strokeWidth={1}
                      />
                      {i % 2 === 0 && (
                        <text
                          x={x + 2}
                          y={-headerHeight + 20}
                          fontSize={10}
                          fontFamily="Arial, Helvetica, sans-serif"
                        >
                          {i}:00
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* row labels */}
                {rows.map((r, rowIdx) => (
                  <text
                    key={r.key}
                    x={-svgPadding + 6}
                    y={rowIdx * (rowHeight + rowGap) + rowHeight / 2 + 4}
                    fontSize={11}
                    fontFamily="Arial, Helvetica, sans-serif"
                  >
                    {r.label}
                  </text>
                ))}

                {/* duty rectangles */}
                {rowRects.flat().map((rect, ri) => (
                  <g key={ri}>
                    <rect
                      x={rect.x}
                      y={rect.y - headerHeight - svgPadding}
                      width={rect.width}
                      height={rect.height}
                      fill={rect.color}
                      stroke="#333"
                      strokeWidth={0.25}
                      rx={3}
                      ry={3}
                    />
                    {rect.width > 30 && (
                      <text
                        x={rect.x + 4}
                        y={
                          rect.y -
                          headerHeight -
                          svgPadding +
                          rect.height / 2 +
                          4
                        }
                        fontSize={10}
                        fontFamily="Arial, Helvetica, sans-serif"
                        fill="#fff"
                      >
                        {rect.event.location
                          ? rect.event.location
                          : (rect.event.note || rect.event.status).slice(0, 20)}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Export first sheet as PNG
  async function exportPNG() {
    if (!wrappersRef.current || wrappersRef.current.length === 0)
      return alert("Nothing to export yet.");
    try {
      const node = wrappersRef.current[0].parentNode; // include header+remarks+grid
      const dataUrl = await domtoimage.toPng(node, { bgcolor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `eld_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export PNG failed", err);
      alert("Export PNG failed - see console.");
    }
  }

  // Export all sheets as PDF
  async function exportAllPDF() {
    if (!wrappersRef.current || wrappersRef.current.length === 0)
      return alert("Nothing to export yet.");
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      for (let i = 0; i < wrappersRef.current.length; i++) {
        const node = wrappersRef.current[i].parentNode; // include header+remarks+grid
        if (!node) continue;
        const dataUrl = await domtoimage.toPng(node, { bgcolor: "#ffffff" });
        const img = new Image();
        img.src = dataUrl;
        if (img.decode) await img.decode(); // improved load reliability
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const iw = img.width * ratio;
        const ih = img.height * ratio;
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", (pageW - iw) / 2, 20, iw, ih);
      }
      pdf.save(`eld_all_${Date.now()}.pdf`);
    } catch (err) {
      console.error("Export All PDF failed", err);
      alert("Export All PDF failed - see console.");
    }
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button onClick={exportPNG}>Export PNG (first sheet)</button>
        <button onClick={exportAllPDF}>Export All PDF (multi-page)</button>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: 13 }}>Zoom (px/hr):</label>
          <input
            type="range"
            min={20}
            max={120}
            step={5}
            value={pixelsPerHour}
            onChange={(e) => setPixelsPerHour(Number(e.target.value))}
          />
          <div style={{ width: 48, textAlign: "right" }}>{pixelsPerHour}px</div>
        </div>
      </div>

      {dayBuckets.length === 0 ? (
        <div style={{ color: "#666" }}>No ELD events to render yet.</div>
      ) : (
        dayBuckets.map((d, i) => <div key={d.dateKey}>{renderSheet(d, i)}</div>)
      )}
    </div>
  );
}
