# Safora

Safora is a full-stack safety and travel tracking application for tourists and police monitoring. The app helps users plan or track travel to popular tourist destinations, monitor their live location during trips, and escalate risk situations when they drift from the expected route. It also supports a police portal for monitoring active users and viewing cases.

This project combines:
- A React + Vite frontend for the user and police dashboards
- An Express backend for authentication, trip logic, route planning, and monitoring
- File-based JSON storage instead of a database
- Optional integrations with OpenStreetMap/OSRM, Gemini, and a mobile SMS endpoint

---

## Project overview

Safora is designed around a simple safety model:

1. A user logs in to a user portal.
2. They browse package destinations and routes.
3. They can plan a trip or start a trip for a selected destination.
4. Live location data is uploaded while the trip is active.
5. If the user deviates from the expected route for long enough, the system identifies a risk case.
6. Emergency contacts can be notified, and police can monitor the situation.

The application simulates a real-world safety dashboard while staying lightweight and easy to run locally.

---

## Core features

### User portal
- Login / registration for users
- Police and user portals are separated
- Package discovery for Indian tourist destinations
- Destination cards with route previews and basic travel details
- Trip planning using a route service or fallback route logic
- Live trip start/end flow
- Emergency contact management
- Device token and location tracking support
- SOS-style trip safety workflow
- Optional travel briefing generation with Gemini

### Police portal
- Live overview of active users and active trip cases
- Case list for users who have drifted off route
- User detail view with contacts and trip history
- Map view showing user movement and case context

### Safety and monitoring logic
- GPS / location history tracking
- Route deviation monitoring
- Automatic police case creation when a user stays off-route beyond a threshold
- Emergency SMS sending to saved contacts
- File-backed persistence for all user, trip, police, and location records

---

## Tech stack

### Frontend
- React 19
- Vite
- Leaflet + React Leaflet for map rendering
- CSS-based layout and dashboard styling

### Backend
- Node.js
- Express 5
- File-based JSON persistence
- bcrypt for password hashing
- Optional external APIs for route planning and AI synthesised trip briefings

### External services used
- OpenStreetMap Nominatim for place geocoding
- OSRM (Open Source Routing Machine) for route generation
- Gemini API for trip briefing generation
- Android SMS gateway for emergency contact messages

---

## Repository structure

```text
safora/
├── README.md
├── dev.js
├── package.json
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── jwt/
│   │   └── token.json
│   ├── middleware/
│   │   └── tokenVerify.js
│   ├── package/
│   │   └── packageInfo.json
│   ├── router/
│   │   ├── clearRouter.js
│   │   ├── contactRouter.js
│   │   ├── deviceTokenRouter.js
│   │   ├── locationRouter.js
│   │   ├── packageRouter.js
│   │   ├── policeRouter.js
│   │   ├── registerRouter.js
│   │   └── tripRouter.js
│   ├── user/
│   │   ├── emergencyContacts.json
│   │   ├── locationHistory.json
│   │   ├── policeInfo.json
│   │   ├── trips.json
│   │   └── userInfo.json
│   └── utils/
│       ├── caseEscalation.js
│       ├── sms.js
│       └── tripLocationMonitor.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        ├── components/
        │   └── map.jsx
        ├── images/
        └── pages/
            ├── auth.jsx
            ├── dashboard.jsx
            └── police.jsx
```

---

## How the app works

### 1. Authentication
The backend stores user accounts and police accounts as JSON records. Passwords are hashed using bcrypt before saving.

Each successful login creates or refreshes a token and stores it in:
- backend/jwt/token.json

The middleware checks the Authorization header, validates the token, and assigns the request portal (`user` or `police`).

### 2. Package catalog
The backend initialises a list of travel packages in:
- backend/package/packageInfo.json

Each package has:
- package id
- name
- state
- destination coordinates
- route information
- profile data for destination details

A seeded route is created for each destination, using OSRM if available, otherwise a local fallback route. This keeps the map functional even when external services are unavailable.

### 3. Trip flow
When a user selects a destination and starts a trip, the frontend sends a POST request to the trips API. The backend saves the trip in:
- backend/user/trips.json

The trip includes fields like:
- id
- package_id
- package_name
- start time
- end time
- comments
- locations
- plannedRoute (for planned itineraries)
- policeCase (if flagged)

### 4. Location tracking
The user submits latitude/longitude updates through the location endpoint.

The backend writes location history into:
- backend/user/locationHistory.json

This location stream is used for:
- map display
- route evaluation
- deviation detection
- police monitoring

### 5. Deviation monitoring
The trip monitor checks whether the current position is still within an acceptable route range. If a user stays off the route too long, the system marks the trip as a police case.

Case escalation logic is in:
- backend/utils/caseEscalation.js

When triggered:
- the trip receives a `policeCase` object
- emergency contacts are fetched
- SMS is sent to those contacts if configured
- police portal can view the case

### 6. Police portal
The police dashboard pulls the current user list and case data from the API:
- /api/police/overview
- /api/police/users/:userId

This lets the police officer see:
- where users currently are
- which trips are active
- which users are deviating from the route
- who the emergency contacts are

---

## Main backend routes

### Authentication routes
- POST /user/register
- POST /user/login

### Package routes
- GET /packages
- GET /packages/:packageId
- POST /packages/plan-route

### Trip routes
- GET /api/trips
- POST /api/trips
- POST /api/trips/:tripId/start
- PUT /api/trips/:tripId/end
- DELETE /api/trips/:tripId

### Location routes
- POST /api/location
- GET /api/location

### Police routes
- GET /api/police/overview
- GET /api/police/users/:userId

### Clear data route
- DELETE /clear

---

## Frontend flow

The frontend is built around a single app state switch:
- If no token exists, show the auth page
- If a token exists, route to either the user dashboard or police dashboard based on the selected portal

### Auth page
The auth screen supports:
- login/register toggle
- user vs police portal selection
- delete-all-data confirmation workflow

### User dashboard
The dashboard allows users to:
- browse destinations and preview routes
- filter packages by search and radius
- view package information
- plan route and start trip
- monitor trip status
- add or edit emergency contacts
- save a device token
- end a trip and leave comments

### Map component
The map displays:
- route lines
- user locations
- trip markers
- active trip history
- all destination routes

---

## Environment variables

The project supports optional environment configuration for real integrations.

### Backend
Create environment variables in the backend environment if you want real service integrations.

```bash
GEMINI_API_KEY=your_google_gemini_key
OSRM_BASE_URL=https://router.project-osrm.org
OSRM_BACKUP_BASE_URL=https://routing.openstreetmap.de/routed-car
ANDROID_SMS_URL=http://192.168.1.8:8080/message
```

### Notes
- If `GEMINI_API_KEY` is missing, the trip briefing feature simply does not generate a summary.
- If OSRM is not reachable, the app falls back to a local route approximation.
- SMS sending depends on a reachable Android SMS endpoint configured in `backend/utils/sms.js`.

---

## Running the project

### Option 1: run both apps together from the root
From the project root:

```bash
cd safora
npm run dev
```

This uses the root `dev.js` script to launch:
- the backend in watch mode
- the frontend via Vite

### Option 2: run backend manually
```bash
cd safora/backend
npm install
npm run dev
```

Or:

```bash
npm start
```

The backend runs on:
- http://localhost:3000

### Option 3: run frontend manually
```bash
cd safora/frontend
npm install
npm run dev
```

The frontend usually runs at:
- http://localhost:5173

---

## Default app behavior

The project is designed to work out of the box with local JSON files. It includes seeded package data and sample police-case workflows.

### Sample data includes
- tourist destination entries for Indian landmarks
- route approximations between Alandur Metro and destination coordinates
- sample user accounts / stored data files
- emergency contact and trip examples

This makes the app usable immediately for local demos without requiring a database.

---

## Notes on data storage

Because this is a local prototype, all data is saved in JSON files under:
- backend/user/
- backend/jwt/
- backend/package/

Files include:
- userInfo.json
- policeInfo.json
- trips.json
- locationHistory.json
- emergencyContacts.json
- token.json
- packageInfo.json

This makes the app easy to inspect and modify, but it is not production-grade persistence.

---

## Security and limitations

This project is a learning/demo application and has some limitations:

- It uses local JSON files instead of a real database
- Token validation is lightweight and file-based
- The backend does not include advanced deployment security features
- SMS and AI integrations are optional and may require external services
- Some route and location features depend on live device and network access

This is suitable for a prototype, hackathon, or local demo project.

---

## Suggested next improvements

- Add a real database such as PostgreSQL or MongoDB
- Add JWT signing with secret-based verification instead of file token matching
- Improve route deviation logic with geofencing and safer calculations
- Add real authentication and role management
- Move emergency notifications to a production SMS/WhatsApp provider
- Add test coverage
- Add docker-compose support for local deployment
- Introduce a proper admin and police dashboard with authorization

---

## Summary

Safora is a combined safety and travel-monitoring platform that helps users track journeys to tourist destinations while providing a live monitoring experience for police or trusted responders. It is designed as a practical full-stack project demonstrating route planning, location tracking, route deviation logic, emergency contacts, and real-time monitoring using a lightweight file-based backend.

If you want to explore the code quickly, start with:
- backend/server.js
- backend/router/packageRouter.js
- backend/router/tripRouter.js
- backend/router/policeRouter.js
- frontend/src/App.jsx
- frontend/src/pages/dashboard.jsx
- frontend/src/pages/police.jsx

---

## Quick start summary

```bash
# Backend
cd safora/backend
npm install
npm run dev

# Frontend
cd safora/frontend
npm install
npm run dev
```

Or from the project root:

```bash
cd safora
npm run dev
```

Then open:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
