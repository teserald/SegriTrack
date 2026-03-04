const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pickup = require('./src/models/Pickup');

async function updatePrecise() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        console.log("Connected...");

        const userEmail = 'user@segritrack.com';
        // Precise CEAdoor: [lng, lat]
        const preciseCoords = [76.7182, 9.1324];

        // 1. Update User
        const user = await User.findOneAndUpdate(
            { email: userEmail },
            {
                'address.location.coordinates': preciseCoords,
                'address.street': 'College of Engineering Adoor, Manakala',
                'address.city': 'Adoor'
            },
            { new: true }
        );
        if (user) console.log("User updated to precise coordinates.");

        // 2. Update Active Pickups
        if (user) {
            const result = await Pickup.updateMany(
                { user: user._id, status: { $in: ['scheduled', 'in-progress'] } },
                {
                    'location.coordinates': preciseCoords,
                    'location.address': 'College of Engineering Adoor, Manakala, Adoor'
                }
            );
            console.log(`Updated ${result.modifiedCount} active pickups to precise coordinates.`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updatePrecise();
