const mongoose = require('mongoose');
const User = require('./src/models/User');
const Worker = require('./src/models/Worker');
const Pickup = require('./src/models/Pickup');

async function reset() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        console.log("Connected...");

        const userEmail = 'user@segritrack.com';
        const workerEmail = 'worker@segritrack.com';

        // 1. Fix User
        const user = await User.findOne({ email: userEmail });
        if (user) {
            user.address.street = 'College of Engineering Adoor, Manakala';
            user.address.city = 'Adoor';
            user.address.location = {
                type: 'Point',
                coordinates: [76.7337, 9.1526]
            };
            await user.save();
            console.log("User updated and saved.");
        }

        // 2. Fix Worker
        const worker = await Worker.findOne({ email: workerEmail });
        if (worker) {
            worker.currentLocation = {
                type: 'Point',
                coordinates: [76.773261, 9.158186]
            };
            worker.status = 'active';
            await worker.save();
            console.log("Worker updated and saved.");
        }

        // 3. Fix Active Pickups
        if (user) {
            const pickups = await Pickup.find({ user: user._id, status: { $in: ['scheduled', 'in-progress'] } });
            for (const p of pickups) {
                p.location = {
                    address: 'College of Engineering Adoor, Manakala, Adoor',
                    type: 'Point',
                    coordinates: [76.7337, 9.1526]
                };
                await p.save();
            }
            console.log(`Fixed ${pickups.length} pickups.`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error("CRITICAL ERROR:", e);
        process.exit(1);
    }
}

reset();
