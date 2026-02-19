# 🚚 Truck HOS Planner (Django + React)

A full-stack demo app that simulates **Hours of Service (HOS)** planning for truck drivers.
Users input trip details, the backend generates a compliant trip plan
the frontend shows routes on a map and ELD daily log sheets are drawn.

---

## ✨ Features

* 📍 Input driver id, start, pickup and dropoff locations
* ⏱️ Input start time and driver cycle details
* 🗺️ Map showing the route with start, pickup and dropoff markers
* 📊 Auto-generated trip events (driving, fueling, breaks, sleeper, etc.)
* 📜 ELD log sheet rendering per day, exportable as PNG or PDF
* ✅ Complies with FMCSA HOS rules (70hr/8day, no adverse exceptions)
* 🎨 Clean professional UI/UX

---

## 🛠 Tech Stack

* **Backend**: Django REST Framework, Gunicorn
* **Frontend**: React + Leaflet, Axios, jsPDF, dom-to-image-more
* **APIs**: OpenRouteService (optional) + Nominatim reverse geocoding
* **Styling**: Custom CSS with modern design

---

## 🚀 Local Development

### 1. Clone the repositories

```bash
# clone backend
git clone https://github.com/your-username/truck-backend.git
cd truck-backend

# clone frontend
git clone https://github.com/your-username/truck-frontend.git
cd truck-frontend
```

---

### 2. Backend Setup (Django)

```bash
cd truck-backend
python -m venv env
source env/bin/activate   # on Windows: env\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file inside `truck-backend/`:

```
SECRET_KEY=your_secret_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000
ORS_API_KEY=
GEOCODING_ENABLED=False
```
> ⚠️ **Note on GEOCODING_ENABLED**  
> - `True` → backend will call OpenStreetMap **Nominatim API** to resolve coordinates into `"City, State"`.  
> - `False` → backend will skip geocoding and return raw latitude/longitude instead.  
> - Nominatim has strict limits (≈1 request/sec, ~1000/day per IP).  
>   Keep it `False` during **local development** to avoid rate-limit errors,  
>   and switch to `True` in **demo/deployment** so users see real city/state names.

Run migrations:

```bash
python manage.py migrate
```

Create a sample driver:

```bash
python manage.py shell
>>> from api.models import Driver
>>> Driver.objects.create(name="Test Driver", cycle_type="70/8", timezone="UTC")
>>> exit()
```

Start backend server:

```bash
python manage.py runserver 0.0.0.0:8000
```

Backend API will be available at:
👉 `http://localhost:8000/api/plan-trip/`

---

### 3. Frontend Setup (React)

```bash
cd truck-frontend
npm install
```

Create `.env` file inside `truck-frontend/`:

```
REACT_APP_API_URL=http://localhost:8000
```

Run frontend:

```bash
npm start
```

Frontend will be available at:
👉 `http://localhost:3000`

---

## 🔗 How Backend and Frontend Communicate

* React frontend sends trip details to Django backend at:
  `POST http://localhost:8000/api/plan-trip/`
* Django backend computes the route, events and logs then responds with JSON
* React frontend renders the map with markers and generates the ELD log sheets

---

## 📦 Deployment

### Backend (Django)

1. Push `truck-backend` repo to GitHub
2. Deploy on **Heroku, Railway, or Render**
3. Set environment variables from `.env` in your hosting service
4. Expose API at `https://your-backend-service.com/api/plan-trip/`

### Frontend (React)

1. Push `truck-frontend` repo to GitHub
2. Deploy on **Vercel or Netlify**
3. In frontend `.env`, set:

```
REACT_APP_API_URL=https://your-backend-service.com
```

4. Redeploy the frontend so it points to the live backend

---

## 📤 GitHub Instructions

If backend and frontend are in separate repos:

```bash
# inside backend
git init
git branch -M main
git remote set-url origin https://github.com/your-username/truck-backend.git
git push -u origin main

# inside frontend
git init
git branch -M main
git remote set-url origin https://github.com/your-username/truck-frontend.git
git push -u origin main
```

---

## 🎥 Loom Walkthrough

1. Show cloning the repos from GitHub
2. Show backend setup: `.env`, migrations, sample driver, runserver
3. Show frontend setup: `.env`, npm install, npm start
4. Demo app running: enter trip details, show route on map, show ELD logs
5. Show exporting PNG and PDF log sheets
6. End by confirming deployment links work

---

## ✅ Deliverables Checklist

* [x] Django backend with `/api/plan-trip/`
* [x] React frontend with Trip Form, Map and ELD Logs
* [x] UI styled for professional look
* [x] Working locally with backend ↔ frontend connection
* [x] Ready for GitHub + hosted demo + Loom video
