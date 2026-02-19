# 🚚 Truck HOS Planner (Django + React)

A full-stack demo app that simulates **Hours of Service (HOS)** planning for truck drivers.  
The app allows users to input trip details, generates a compliant trip plan,  
shows routes on a map, and visualizes ELD daily log sheets.

---

## ✨ Features

- 📍 Input **start, pickup, and dropoff locations**
- ⏱️ Input **start time** and driver cycle details
- 🗺️ **Map** showing the route with start, pickup, and dropoff markers
- 📊 Auto-generated **trip events** (driving, fueling, breaks, sleeper, etc.)
- 📜 ELD log sheet rendering (per day), exportable as **PNG/PDF**
- ✅ Complies with **FMCSA HOS rules** (70hr/8day, no adverse exceptions)
- 🎨 Clean and professional **UI/UX**

---

## 🛠️ Tech Stack

- **Backend**: Django REST Framework
- **Frontend**: React + Leaflet
- **APIs**: OpenRouteService (optional, fallback to haversine if no key)
- **Styling**: Custom CSS with modern design

---

## 🚀 Local Development

### 1. Clone the repo

```bash
git clone https://github.com/your-username/truck-hos-planner.git
cd truck-hos-planner
```
