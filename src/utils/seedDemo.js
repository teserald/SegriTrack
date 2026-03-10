const mongoose = require('mongoose');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Pickup = require('../models/Pickup');

async function seedDemoPickups() {
    try {
        console.log('[SEED] Checking for demo user...');

        const DEMO_USER_COORDS = [76.7337, 9.1526]; // [lng, lat] - CE Adoor
        let mainUser = null;

        // Provision 5 Demo Users
        const userMocks = [];
        for (let i = 1; i <= 5; i++) {
            let email = i === 1 ? 'user@segritrack.com' : `user${i}@segritrack.com`;
            let name = i === 1 ? 'Demo User' : `Demo User ${i}`;
            
            let user = await User.findOne({ email });
            let addressStreet = i === 1 ? "College of Engineering Adoor, Manakala" : `Adoor Mock Street ${i}`;
            
            if (!user) {
                user = new User({
                    name: name,
                    email: email,
                    password: "password123",
                    address: {
                        street: addressStreet,
                        city: "Adoor",
                        zip: "691523",
                        location: {
                            type: "Point",
                            coordinates: DEMO_USER_COORDS
                        }
                    }
                });
                await user.save();
            } else {
                await User.findByIdAndUpdate(user._id, {
                    name: name,
                    'address.street': addressStreet,
                    'address.city': 'Adoor',
                    'address.location.coordinates': DEMO_USER_COORDS
                });
            }
            if (i === 1) mainUser = user;
            userMocks.push(user);
        }
        console.log(`[SEED] Ensured ${userMocks.length} demo users exist.`);

        // Clean up ALL previous test/demo pickups
        await Pickup.deleteMany({ qrCode: { $regex: /^(DEMO-|TSP-|SLOT-)/ } });
        console.log('[SEED] Cleared previous test pickups.');

        // Unstick the worker from pickup overlaps and provision 5 total workers
        const workerMocks = [];
        for (let i = 1; i <= 5; i++) {
            let email = i === 1 ? 'worker@segritrack.com' : `worker${i}@segritrack.com`;
            let name = `Demo Worker ${i}`;
            // Different starting points near Adoor to prevent overlap
            let startLng = 76.7450 + (i * 0.002);
            let startLat = 9.1600 + (i * 0.002);

            let worker = await Worker.findOne({ email });
            // The prompt also requested to rename 'Worker 1' if it existed with generic email. So let's handle "Worker 1" legacy renaming just by updating.
            // But we can just depend on updating the doc by email.
            if (!worker) {
                 // Check if there is an old 'worker1@segritrack.com' we need to update to 'Demo Worker 2' ? Yes it matches `email` in the loop.
                 worker = new Worker({
                    name: name,
                    email: email,
                    password: 'password',
                    phone: '9876543210',
                    assignedArea: 'Demo Area',
                    status: 'active',
                    currentLocation: {
                        type: "Point",
                        coordinates: [startLng, startLat]
                    }
                 });
                 await worker.save();
            } else {
                 await Worker.findByIdAndUpdate(worker._id, {
                    name: name,
                    status: 'active',
                    'currentLocation.coordinates': [startLng, startLat]
                 });
            }
            workerMocks.push(worker);
        }
        console.log(`[SEED] Ensured ${workerMocks.length} demo workers exist.`);

        // 5 Preassigned demo pickups around Adoor, Kerala
        // Worker starts at CE Adoor: [76.7182, 9.1324]
        const tasks = [
            {
                user: mainUser._id,
                date: new Date(),
                slot: 'Morning (08:00 AM - 10:00 AM)',
                status: 'scheduled',
                location: {
                    address: "Enathu",
                    type: "Point",
                    coordinates: [76.8100, 9.2100]
                },
                qrCode: 'DEMO-001'
            },
            {
                user: mainUser._id,
                date: new Date(),
                slot: 'Morning (08:00 AM - 10:00 AM)',
                status: 'scheduled',
                location: {
                    address: "Anandapally",
                    type: "Point",
                    coordinates: [76.7550, 9.1650]
                },
                qrCode: 'DEMO-002'
            },
            {
                user: mainUser._id,
                date: new Date(),
                slot: 'Afternoon (02:00 PM - 04:00 PM)',
                status: 'scheduled',
                location: {
                    address: "Adoor Central Junction",
                    type: "Point",
                    coordinates: [76.7400, 9.1550]
                },
                qrCode: 'DEMO-003'
            },
            {
                user: mainUser._id,
                date: new Date(),
                slot: 'Afternoon (02:00 PM - 04:00 PM)',
                status: 'scheduled',
                location: {
                    address: "College of Engineering Adoor, Manakala",
                    type: "Point",
                    coordinates: DEMO_USER_COORDS
                },
                qrCode: 'DEMO-004'
            },
            {
                user: mainUser._id,
                date: new Date(),
                slot: 'Afternoon (02:00 PM - 04:00 PM)',
                status: 'scheduled',
                location: {
                    address: "Ezhamkulam",
                    type: "Point",
                    coordinates: [76.7000, 9.1200]
                },
                qrCode: 'DEMO-005'
            }
        ];

        await Pickup.insertMany(tasks);
        console.log('[SEED] Successfully seeded 5 demo pickups for Route Optimization display.');

    } catch (err) {
        console.error('[SEED Error]', err);
    }
}

module.exports = seedDemoPickups;
