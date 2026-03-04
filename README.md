<<<<<<< HEAD
# SegriTrack 🌿

Waste Collection and Segregation Monitoring System.

## Project Structure
- `public/`: Frontend files
    - `user/`: Citizen portal (Schedule, Track, Redeem)
    - `worker/`: Collector portal (Pickup list, QR Scan, Status)
    - `admin/`: Management portal (Live Map, Stats)
- `src/`: Backend logic
    - `models/`: Database schemas
    - `routes/`: API endpoints
- `server.js`: Main application server

## Setup Instructions

1. **Install Node.js**: Ensure Node.js is installed on your system.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Config**:
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/segritrack
   PORT=3000
   ```
4. **Run Server**:
   ```bash
   npm start
   ```

## Accessing Portals
- **User Portal**: [http://localhost:3000/](http://localhost:3000/)
- **Worker Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Portal**: [http://localhost:3000/admin/login.html](http://localhost:3000/admin/login.html)

## Features
- **Real-time Tracking**: Live worker location on the map.
- **QR Verification**: Verify pickups and ensuring attendance.
- **Segregation Rewards**: Rate segregation quality and award points.
=======
