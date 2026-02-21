# 🚚 Truck HOS Planner- Django + React

A full-stack application for the trucking industry to help drivers and fleet managers track Hours of Service (HOS) and generate Electronic Logging Device (ELD) logs. This project uses a React frontend and a Django backend.

## ✨ Features

*   📍 **Trip Planning:** Input driver ID, start/pickup/dropoff locations.
*   🗺️ **Route Visualization:** Displays the entire route on a map with key markers.
*   📊 **Automated Event Generation:** Creates a compliant trip plan with driving, fueling, and rest events.
*   📜 **ELD Log Sheets:** Renders daily ELD logs that can be exported to PDF.
*   ✅ **FMCSA Compliance:** Adheres to HOS rules (e.g., 70hr/8day cycle).

## 🛠 Tech Stack

*   **Backend**: Django, Django REST Framework, Gunicorn, PostgreSQL
*   **Frontend**: React, Leaflet, Axios, Material-UI
*   **Deployment**: **Render** (Backend), **Vercel** (Frontend)

---

## 🚀 Local Development Setup

### 1. Prerequisites

*   Git
*   Python & Pip
*   Node.js & npm

### 2. Clone the Repository

```bash
git clone <your_repository_url>
cd <your_repository_name>
```

### 3. Backend Setup (`truck-backend`)

1.  **Navigate to the backend directory and install dependencies:**
    ```bash
    cd truck-backend
    pip install -r requirements.txt
    ```

2.  **Create a `.env` file** in the `truck-backend` directory with your local settings:
    ```env
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1

    # Use a local SQLite database for development
    DATABASE_URL=sqlite:///db.sqlite3

    # Local frontend URL
    CORS_ALLOWED_ORIGINS=http://localhost:3000

    # API Keys (optional for local dev)
    GEOCODING_ENABLED=True
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
    cd ../truck-frontend  # From the backend directory
    npm install
    ```

2.  **Create a `.env` file** in the `truck-frontend` directory:
    ```env
    REACT_APP_API_URL=http://127.0.0.1:8000
    REACT_APP_GEOAPIFY_API_KEY=your_geoapify_api_key
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```
    The frontend will open at `http://localhost:3000`.

---

## 📦 Deployment

This application is configured for deployment with a **Django backend on Render** and a **React frontend on Vercel**.

### Backend on Render

1.  Connect your Git repository to a new **Web Service** on Render.
2.  Set the **Build Command** to: `pip install -r requirements.txt && python manage.py migrate`
3.  Set the **Start Command** to: `gunicorn config.wsgi`
4.  Add the following environment variables in your Render dashboard:

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
2.  Vercel will automatically detect that it is a Create React App and configure the build settings.
3.  Add the following environment variables in your Vercel project settings:

    ```
    REACT_APP_API_URL          # Your backend URL from Render
    REACT_APP_GEOAPIFY_API_KEY # Your Geoapify API key
    ```
4.  Deploy! Vercel will build and deploy your frontend.