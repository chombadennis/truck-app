# Blueprint: HOS Planner

## 1. High-Level Overview

The HOS Planner is a comprehensive solution for managing trucking operations, specifically designed for trip planning that adheres to Hours of Service (HOS) regulations. It provides drivers with a user-friendly interface for planning a route and generating a preview of an Electronic Logging Device (ELD) log for that trip.

The application is designed to ensure compliance with FMCSA regulations, improve operational efficiency, and enhance driver safety by proactively planning compliant trips.

## 2. Architecture

The application follows a modern, decoupled client-server architecture:

*   **Frontend:** A React-based single-page application (SPA) that provides the user interface. It is responsible for gathering user input, displaying the map and route, and rendering the final ELD log. It is deployed on **Vercel** for fast global delivery.
*   **Backend:** A Django-based REST API that handles all business logic, data validation, and communication with external mapping services. It is deployed on **Render**.

## 3. Project Structure

The project is organized into two main directories: `truck-frontend` and `truck-backend`.

### 3.1. `truck-frontend` (Client)

This directory contains the React application, built with Create React App and styled with **Tailwind CSS v3**.

| File/Folder | Description |
| --- | --- |
| `src/` | The main source code for the React application. |
| `src/App.js` | The main application component. It manages the overall state (trip data, loading status, errors), handles the initial server connection, and orchestrates all other components. |
| `src/components/` | Reusable React components used throughout the application. |
| `src/components/GeoSearchField.js` | A specialized input component that uses the Leaflet Geosearch plugin to provide location search and autocomplete functionality. T |
| `src/components/TripForm.js` | A key component containing the form where users input trip details like driver info, vehicle info, start/pickup/dropoff locations (via map clicks), and HOS rules. |
| `src/components/MapComponent.js` | Responsible for rendering the interactive map using **Leaflet**. It displays the trip route (as a **GeoJSON** polyline), markers for key locations, and handles map click events to set coordinates. |
| `src/components/ELDLog.js` | Displays the generated ELD events in a clear, logbook format and includes the logic for exporting the view to a PDF. |
| `src/components/AlertDialog.js`| A reusable modal component for showing success or error messages to the user. |
| `src/utils/` | Utility functions used by the application. |
| `src/utils/geo.js` | Contains the `reverseGeocode` utility function. It communicates with the **Nominatim API** to convert latitude/longitude coordinates (from map clicks) into human-readable place names, which are then displayed in the form. |
| `src/utils/pdfDownloader.js` | This utility uses `jsPDF` and `html2canvas` to capture the `ELDLog` component's HTML and convert it into a downloadable PDF file. |
| `public/` | Static assets that are served directly by the web server. |
| `package.json` | Defines the project's npm dependencies (React, Leaflet, Axios, Tailwind CSS, etc.) and scripts. |

### 3.2. `truck-backend` (Server)

This directory contains the Django REST Framework application.

| File/Folder | Description |
| --- | --- |
| `api/` | The core Django app that implements the REST API. |
| `api/models.py` | Contains the database models for `ComplianceRule`, `Driver`, `Vehicle`, and `Trip`. |
| `api/views.py` | Defines the API endpoints. `plan_trip` is the main view, orchestrating the route planning and HOS calculations. `RulesListView` serves the available compliance rules. |
| `api/serializers.py` | Contains serializers for validating and deserializing incoming request data for the `plan_trip` view. |
| `api/urls.py` | Defines the URL patterns for the API, routing requests to the appropriate views. |
| `api/hos_engine.py` | The core business logic for the application. It takes raw route data and applies FMCSA rules to calculate required breaks and generate a compliant sequence of ELD events. |
| `api/route_service.py` | A service module responsible for communicating with the external **OpenRouteService** API to fetch route geometry and duration. |
| `config/` | The Django project's settings and configuration. |
| `config/settings.py` | **The central configuration file for the Django project.** It controls database connections (reading `DATABASE_URL`), installed apps, middleware, CORS headers for frontend communication, and securely loads sensitive keys (like `ORS_API_KEY` and `SECRET_KEY`) from environment variables. |
| `manage.py` | **A command-line utility for Django.** It is the primary tool for interacting with the Django project to perform tasks such as running the development server (`runserver`), applying database changes (`migrate`), creating new apps, and other administrative tasks. |
| `requirements.txt` | A list of all Python dependencies required for the project (Django, djangorestframework, psycopg2-binary, gunicorn, etc.). |

## 4. Key Libraries & Services

*   **React:** For building the user interface.
*   **Tailwind CSS:** For all styling and creating a modern, responsive UI.
*   **Leaflet.js:** An open-source library for interactive maps. Used to render the route from **GeoJSON** data.
*   **OpenStreetMap:** Provides the free tile layer for the Leaflet map background.
*   **Axios:** For making asynchronous HTTP requests from the frontend to the backend API.
*   **OpenRouteService API:** The external service used by the backend to calculate the driving route and total trip duration/distance between two points.
*   **Nominatim API:** Used for reverse geocoding to find place names from coordinates for a better user experience.
*   **Django REST Framework:** A powerful toolkit for building the web API in the backend.
*   **Gunicorn:** A production-grade WSGI server used to run the Django application on Render.
*   **Neon:** A serverless PostgreSQL provider, used as the production database.
*   **jsPDF & html2canvas:** Used in combination on the frontend to generate PDF exports of the ELD logs.

## 5. Deployment

The application is deployed with a decoupled frontend and backend.

*   **Frontend:** The React application is deployed to **Vercel**.
*   **Backend:** The Django API is deployed to **Render**.

## 6. Getting Started

### 6.1. Frontend

1.  Navigate to the `truck-frontend` directory.
2.  Install the dependencies: `npm install`
3.  Start the development server: `npm start`

### 6.2. Backend

1.  Navigate to the `truck-backend` directory.
2.  Install the dependencies: `pip install -r requirements.txt`
3.  Run the database migrations: `python manage.py migrate`
4.  Start the development server: `python manage.py runserver`
