# 🚚 Truck HOS Planner - Django + React

A full-stack demo app that simulates Hours of Service (HOS) planning for truck drivers. Users input trip details, the backend generates a compliant trip plan the frontend shows routes on a map and ELD daily log sheets are drawn.

## ✨ Features

*   📍 **Dynamic Trip Planning:** Input driver ID, vehicle details, and start/pickup/dropoff locations.
*   🗺️ **Interactive Route Visualization:** Displays the entire calculated route on an interactive map powered by Leaflet, with markers for key locations.
*   📊 **Automated Event Generation:** Creates a compliant trip plan based on FMCSA rules, intelligently inserting driving, on-duty (for fueling), and off-duty (for rest breaks) events.
*   📜 **ELD Log Preview:** Renders a daily ELD log sheet from the planned trip, which can be exported to PDF.
*   ✅ **FMCSA Compliance:** Adheres to selected HOS rules (e.g., the 70-hour/8-day cycle) for trip planning.

## 🛠 Tech Stack

*   **Backend**: Django, Django REST Framework, Gunicorn, PostgreSQL (via Neon).
*   **Frontend**: React, **Tailwind CSS**, Axios, **Leaflet.js** for mapping.
*   **Data Formats**: **GeoJSON** for representing map routes.
*   **Mapping & Geocoding**:
    *   **OpenStreetMap**: Used as the base map tile layer.
    *   **OpenRouteService**: For generating the trip route and directions.
    *   **Nominatim**: For reverse geocoding coordinates to place names.
*   **PDF Generation**: jsPDF, html2canvas.
*   **Deployment**: Backend on **Render**, Frontend on **Vercel**.

## ‼️ Caveat: Cold Starts on Free Tiers

This application uses a modern split deployment architecture. The frontend is hosted on Vercel, which delivers a fast, globally distributed client experience, while the backend API is powered by Django running on Render.

Because the project uses Render’s free tier, the backend service automatically "sleeps" during inactivity. When a user opens the app after a period of idle time, the Django server must first wake up and reinitialize before responding to requests. This brief cold-start delay (up to 30 seconds) can momentarily affect the app’s loading behavior, as the frontend depends on the backend API to fetch data and fully boot the user interface. A loading indicator has been implemented to inform the user during this process.

---

## 🚀 Local Development Setup

### 1. Prerequisites

*   Git
*   Python & Pip
*   Node.js & npm

### 2. Clone the Repository

```bash
git clone https://github.com/chombadennis/truck-app.git
cd truck-app
```

### 3. Backend Setup (`truck-backend`)

1.  **Navigate to the backend directory and install dependencies:**
    ```bash
    cd truck-backend
    pip install -r requirements.txt
    ```

2.  **Create a `.env` file** in the `truck-backend` directory:
    ```env
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1
    DATABASE_URL=sqlite:///db.sqlite3
    CORS_ALLOWED_ORIGINS=http://localhost:3000
    ORS_API_KEY=your_openrouteservice_api_key
    ```

3.  **Run database migrations and start the server:**
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```
    The backend will be running at `http://127.0.0.1:8000`.

### 4. Frontend Setup (`truck-frontend`)

1.  **Navigate to the frontend directory and install dependencies:**
    ```bash
    cd ../truck-frontend
    npm install
    ```

2.  **Create a `.env` file** in the `truck-frontend` directory:
    ```env
    REACT_APP_API_URL=http://127.0.0.1:8000
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    The frontend will open at `http://localhost:3000`.

---

## 📦 Deployment

This application is deployed with a **Django backend on Render** and a **React frontend on Vercel**.

### Backend on Render

1.  Connect your Git repository to a new **Web Service** on Render.
2.  Set the **Root Directory** to `truck-backend`.
3.  Set the **Build Command** to: `pip install -r requirements.txt && python manage.py migrate`
4.  Set the **Start Command** to: `gunicorn config.wsgi --timeout 180`
5.  Add the following environment variables in your Render dashboard:

    ```
    SECRET_KEY    # Your production Django secret key
    DEBUG         # False
    ALLOWED_HOSTS # Your vercel app url (e.g., my-truck-app.vercel.app)
    DATABASE_URL  # Your production PostgreSQL URL from Neon
    CORS_ALLOWED_ORIGINS # Your frontend URL (e.g., https://my-truck-app.vercel.app)
    ORS_API_KEY # Your OpenRouteService API key
    ```

### Frontend on Vercel

1.  Connect your Git repository to a new project on Vercel.
2.  Set the **Root Directory** to `truck-frontend`.
3.  Vercel will automatically detect that it is a Create React App and configure the build settings.
4.  Add the following environment variable in your Vercel project settings:
    ```
    REACT_APP_API_URL # Your backend URL from Render
    ```
5.  Deploy! Vercel will build and deploy your frontend.
