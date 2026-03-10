const mongoose = require('mongoose');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Pickup = require('../models/Pickup');

async function seedDemoPickups() {
    try {
        console.log('[SEED] Checking for demo user...');

        // The canonical demo user location: College of Engineering Adoor, Manakala
        const DEMO_USER_COORDS = [76.7337, 9.1526]; // [lng, lat] - CE Adoor

        let demoUser = await User.findOne({ email: 'user@segritrack.com' });

        if (!demoUser) {
            console.log('[SEED] Demo user not found, creating user@segritrack.com...');
            demoUser = new User({
                name: "Demo User",
                email: "user@segritrack.com",
                password: "password123",
                address: {
                    street: "College of Engineering Adoor, Manakala",
                    city: "Adoor",
                    zip: "691523",
                    location: {
                        type: "Point",
                        coordinates: DEMO_USER_COORDS
                    }
                }
            });
            await demoUser.save();
        } else {
            // Always reset demo user location to the correct coordinates
            await User.findByIdAndUpdate(demoUser._id, {
                'address.street': 'College of Engineering Adoor, Manakala',
                'address.city': 'Adoor',
                'address.location.coordinates': DEMO_USER_COORDS
            });
            console.log('[SEED] Demo user location reset to College of Engineering Adoor.');
        }

        // Clean up ALL previous test/demo pickups
        await Pickup.deleteMany({ qrCode: { $regex: /^(DEMO-|TSP-|SLOT-)/ } });
        console.log('[SEED] Cleared previous test pickups.');

        // Unstick the worker from pickup overlaps
        let demoWorker = await Worker.findOne({ email: 'worker@segritrack.com' });
        if (demoWorker) {
            await Worker.findByIdAndUpdate(demoWorker._id, {
                'currentLocation.coordinates': [76.7450, 9.1600] // Distinct from all pickups
            });
            console.log('[SEED] Demo worker location reset to distinct starting coordinate.');
        }

        // 5 Preassigned demo pickups around Adoor, Kerala
        // Worker starts at CE Adoor: [76.7182, 9.1324]
        const tasks = [
            {
                user: demoUser._id,
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
                user: demoUser._id,
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
                user: demoUser._id,
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
                user: demoUser._id,
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
                user: demoUser._id,
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
