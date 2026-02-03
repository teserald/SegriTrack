# SegriTrack Service Integration Guide

This guide explains how to turn the current prototype into a fully functioning system.

## Phase 1: Environment Setup (Prerequisites)
Before running the code, you need the engine (Node.js) and the storage (MongoDB).

1.  **Install Node.js**
    *   Download from [nodejs.org](https://nodejs.org/).
    *   Install the "LTS" version.
    *   Verify by typing `node -v` in your terminal.

2.  **Install MongoDB (Community Server)**
    *   Download from [mongodb.com](https://www.mongodb.com/try/download/community).
    *   Run the installer and include "MongoDB Compass" (a visual tool to see your data).
    *   MongodDB usually starts automatically as a Windows Service.

## Phase 2: Database Initialization (Seeding)
The system is currently empty. You cannot log in because no users exist in the database.

1.  **Create a Seed Script**: You need a small script to inject the first Admin and Worker into the database.
    *   *I can create this for you: `scripts/seed.js`.*
    *   Running this script once will populate `users` and `workers` collections.

## Phase 3: Wiring Frontend to Backend
Currently, the HTML pages use "fake" logic (e.g., `if user === 'admin'`). We need to switch this to use "real" API calls.

1.  **Update Login Pages** (`public/**/login.html`)
    *   **Action**: Remove the hardcoded `if/else` check.
    *   **New Logic**: Use JavaScript `fetch()` to send the email/password to `http://localhost:3000/api/auth/login`.
    *   **On Success**: Save the received `token` or `userId` and redirect to the dashboard.

2.  **Update Dashboards** (User/Worker/Admin)
    *   **Action**: Currently, data is hardcoded (HTML text).
    *   **New Logic**: On page load, use `fetch()` to get data from `http://localhost:3000/api/pickup/assigned` (for workers) or `/api/admin/stats` (for admin).
    *   **Display**: Dynamically insert the received data into the HTML list.

3.  **Connect Real-Time Maps** (`track.html` & `dashboard.html`)
    *   **Action**: Ensure `Socket.io` is strictly connecting to the backend.
    *   **Logic**: When a worker clicks "Start" in their portal, it should emit an event. The Admin map should listen for this event and move the marker.

## Phase 4: Running the System

1.  **Start the Server**
    *   Open terminal in `SegriTrack`.
    *   Run `npm start`.
    *   You should see: `Server running on port 3000` and `MongoDB Connected`.

2.  **Test the Flow**
    *   Open **Worker Portal** -> Log in -> Click "Start".
    *   Open **Admin Portal** -> Check if the worker icon appears/moves.
    *   Open **User Portal** -> Schedule a pickup -> Check if it appears in Worker's list.
