# SegriTrack 🌿

**SegriTrack** is a comprehensive Waste Collection and Segregation Monitoring System designed to streamline waste management, incentivize citizen participation, and provide real-time tracking for efficient operations.

## 🚀 Core Features
- **Real-time Tracking**: Monitor worker locations live on an interactive map.
- **QR Verification**: Securely verify pickups for attendance and accountability.
- **Segregation Rewards**: Rate waste segregation quality and award reward points to citizens.
- **Multi-Portal Access**: Dedicated interfaces for citizens, workers, and administrators.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Leaflet.js (Maps)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Communication**: Socket.io (Real-time updates)

## 📁 Project Structure
- `public/`: Frontend assets and portal pages
    - `index.html`: Main landing page
    - `user/`: Citizen portal (Schedule, Track, Redeem)
    - `worker/`: Collector portal (Pickup list, QR Scan, Status)
    - `admin/`: Management portal (Live Map, Stats)
- `src/`: Backend source code
    - `models/`: Database schemas and models
    - `routes/`: API endpoint definitions and logic
- `server.js`: Main entry point and server configuration

## ⚙️ Setup Instructions

1. **Install Node.js**: Ensure Node.js (LTS recommended) is installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/segritrack
   PORT=3000
   ```
4. **Launch the Application**:
   ```bash
   npm start
   ```

## 🌐 Accessing Portals
- **User Portal**: [http://localhost:3000/](http://localhost:3000/)
- **Worker Portal**: [http://localhost:3000/worker/index.html](http://localhost:3000/worker/index.html)
- **Admin Portal**: [http://localhost:3000/admin/login.html](http://localhost:3000/admin/login.html)


