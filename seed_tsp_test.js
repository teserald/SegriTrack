const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pickup = require('./src/models/Pickup');

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        console.log("Connected to seed test data...");

        const user = await User.findOne({ email: 'user@segritrack.com' });
        if (!user) {
            console.log("No user found.");
            process.exit(1);
        }

        const tasks = [
            {
                user: user._id,
                date: new Date(),
                slot: '09:00 AM - 12:00 PM',
                status: 'scheduled',
                location: {
                    address: "Adoor Town (Near)",
                    type: "Point",
                    coordinates: [76.7337, 9.1526]
                },
                qrCode: 'TSP-111'
            },
            {
                user: user._id,
                date: new Date(),
                slot: '01:00 PM - 04:00 PM',
                status: 'scheduled',
                location: {
                    address: "Midway Point (Mid)",
                    type: "Point",
                    coordinates: [76.7500, 9.1700]
                },
                qrCode: 'TSP-222'
            },
            {
                user: user._id,
                date: new Date(),
                slot: '04:00 PM - 06:00 PM',
                status: 'scheduled',
                location: {
                    address: "Far Out Setup (Far)",
                    type: "Point",
                    coordinates: [76.8000, 9.2000]
                },
                qrCode: 'TSP-333'
            }
        ];

        await Pickup.deleteMany({ qrCode: { $in: ['TSP-111', 'TSP-222', 'TSP-333'] } });
        await Pickup.insertMany(tasks);
        console.log("Seeded 3 test pickups for TSP verification.");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
