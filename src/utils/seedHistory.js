const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Worker = require('../models/Worker');
const Pickup = require('../models/Pickup');

async function seedHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/segritrack');
        console.log('[SEED] Connected to MongoDB');

        // Find demo users and demo worker
        const users = await User.find({ email: { $regex: /user.*@segritrack\.com/ } });
        const demoWorker = await Worker.findOne({ email: 'worker@segritrack.com' });

        if (users.length === 0 || !demoWorker) {
            console.log('[SEED] Demo Users or Worker not found. Run seedDemo.js first.');
            process.exit(1);
        }

        // Check if history already exists to avoid duplicates
        const existingHistory = await Pickup.find({ worker: demoWorker._id, status: 'completed' });
        if (existingHistory.length > 0) {
            console.log('[SEED] History already exists. Deleting past history...');
            await Pickup.deleteMany({ worker: demoWorker._id, status: 'completed' });
        }

        console.log('[SEED] Seeding past completed tasks for history...');

        const pastPickups = [];
        const possibleLocations = [
            { address: "Adoor Municipal Stadium Road", coords: [76.7337, 9.1526] },
            { address: "Green Valley Apartments, Adoor", coords: [76.74, 9.16] },
            { address: "Kerala State Housing Board Colony", coords: [76.72, 9.14] },
            { address: "Parthasarathy Temple Road", coords: [76.735, 9.158] },
            { address: "KSRTC Bus Stand Junction", coords: [76.738, 9.154] },
            { address: "Revenue Tower area", coords: [76.732, 9.150] },
            { address: "Adoor General Hospital vicinity", coords: [76.730, 9.148] },
            { address: "Pazhakulam", coords: [76.715, 9.135] },
            { address: "Ezhamkulam Mahadeva Temple Road", coords: [76.699, 9.119] },
            { address: "Holy Cross College Road", coords: [76.745, 9.165] }
        ];
        
        const wasteTypes = ['Plastic', 'Electronic', 'Paper & Cardboard', 'Glass', 'Metal'];
        const qualities = ['Excellent', 'Good', 'Average', 'Poor'];
        const slots = ["Morning (08:00 AM - 10:00 AM)", "Afternoon (02:00 PM - 04:00 PM)"];

        // Generate exactly 60 pickups spread over the last 30 days
        for (let i = 1; i <= 60; i++) {
            // Random day between 1 and 30 days ago
            const daysAgo = Math.floor(Math.random() * 30) + 1;
            // Random location
            const loc = possibleLocations[Math.floor(Math.random() * possibleLocations.length)];
            // Random waste type and quality
            const wasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
            const quality = qualities[Math.floor(Math.random() * qualities.length)];
            // Random points (10 to 50) and weight (1.0 to 10.0 kg)
            const pts = Math.floor(Math.random() * 41) + 10;
            const wgt = (Math.random() * 9 + 1).toFixed(1);
            // Random slot
            const slot = slots[Math.floor(Math.random() * slots.length)];

            // Select a random user from the pool
            const randomUser = users[Math.floor(Math.random() * users.length)];

            pastPickups.push({
                user: randomUser._id,
                worker: demoWorker._id,
                location: {
                    address: loc.address,
                    coordinates: loc.coords
                },
                date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000), // Randomize hours too
                slot: slot,
                status: 'completed',
                segregationDetails: { quality: quality },
                wasteDetails: { type: wasteType, weight: `${wgt} kg`, pointsAwarded: pts },
                qrCode: `HIST-1M-${i.toString().padStart(3, '0')}`,
                earnings: pts * 2 // Let's say 1 point = 2 rupees earning
            });
        }

        await Pickup.insertMany(pastPickups);
        console.log(`[SEED] Added ${pastPickups.length} completed past pickups to history (1-Month Simulation).`);
        
        process.exit(0);

    } catch (error) {
        console.error('[SEED] Error seeding history:', error);
        process.exit(1);
    }
}

seedHistory();
