# Blueprint: Truck App

## 1. High-Level Overview

The Truck App is a comprehensive solution for managing trucking operations. It provides drivers with a user-friendly interface for recording their Hours of Service (HOS) and generating Electronic Logging Device (ELD) logs, while also offering fleet managers a powerful backend for monitoring and managing their drivers and vehicles.

The application is designed to ensure compliance with FMCSA regulations, improve operational efficiency, and enhance driver safety.

## 2. Architecture

The Truck App follows a classic client-server architecture:

*   **Frontend:** A React-based single-page application (SPA) that provides the user interface for drivers.
*   **Backend:** A Django-based REST API that handles business logic, data storage, and communication with the frontend.

## 3. Project Structure

The project is organized into two main directories: `truck-frontend` and `truck-backend`.

### 3.1. `truck-frontend`

This directory contains the React application.

| File/Folder | Description |
| --- | --- |
| `src/` | The main source code for the React application. |
| `src/components/` | Reusable React components used throughout the application. |
| `src/components/ELDLog.js` | The component responsible for displaying and managing the ELD log. |
| `src/components/TripForm.js` | The form for creating and editing trips. |
| `src/utils/` | Utility functions used by the application. |
| `src/utils/pdfDownloader.js` | A utility for generating and downloading PDF versions of the ELD log. |
| `public/` | Static assets that are served directly by the web server. |
| `package.json` | The project's dependencies and scripts. |
| `build/` | The production build of the application. |

### 3.2. `truck-backend`

This directory contains the Django application.

| File/Folder | Description |
| --- | --- |
| `api/` | The core Django app that implements the REST API. |
| `api/models.py` | The database models for the application. |
| `api/views.py` | The API endpoints for creating, retrieving, updating, and deleting data. |
| `api/serializers.py` | The serializers for converting database models to and from JSON. |
| `api/hos_engine.py` | The business logic for calculating HOS and generating ELD logs. |
| `config/` | The Django project's settings and configuration. |
| `manage.py` | The command-line utility for managing the Django project. |
| `requirements.txt` | The project's Python dependencies. |

## 4. Frontend

The frontend is built with React and utilizes the following key libraries:

*   **React:** For building the user interface.
*   **Material-UI:** For UI components and styling.
*   **Axios:** For making API requests to the backend.
*   **html2pdf.js:** For generating PDF versions of the ELD log.

## 5. Backend

The backend is built with Django and the Django REST Framework.

*   **Django:** A high-level Python web framework.
*   **Django REST Framework:** A powerful and flexible toolkit for building Web APIs.
*   **SQLite:** The database used for local development.

## 6. Deployment

The application is deployed to Firebase Hosting. The frontend is built into a static bundle and deployed to Firebase Hosting's CDN.

## 7. Key Features

*   **HOS Tracking:** The application automatically tracks a driver's HOS based on their duty status.
*   **ELD Log Generation:** The application generates compliant ELD logs in PDF format.
*   **Trip Management:** Drivers can create and manage their trips.
*   **Fleet Management:** Fleet managers can monitor their drivers and vehicles.

## 8. Getting Started

### 8.1. Frontend

1.  Navigate to the `truck-frontend` directory.
2.  Install the dependencies: `npm install`
3.  Start the development server: `npm start`

### 8.2. Backend

1.  Navigate to the `truck-backend` directory.
2.  Install the dependencies: `pip install -r requirements.txt`
3.  Run the database migrations: `python manage.py migrate`
4.  Start the development server: `python manage.py runserver`