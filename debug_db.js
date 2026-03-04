const mongoose = require('mongoose');
const User = require('./src/models/User');
const Worker = require('./src/models/Worker');
const Pickup = require('./src/models/Pickup');

async function debug() {
    await mongoose.connect('mongodb://localhost:27017/segritrack');

    const demoUserEmail = 'user@segritrack.com';
    const demoWorkerEmail = 'worker@segritrack.com';

    console.log("--- DEMO ACCOUNTS ---");
    const u = await User.findOne({ email: demoUserEmail });
    if (u) {
        console.log(`User: ${u.email}`);
        console.log(`  ID: ${u._id}`);
        console.log(`  Street: ${u.address?.street}`);
        console.log(`  Coords: ${JSON.stringify(u.address?.location?.coordinates)}`);
    } else {
        console.log(`User ${demoUserEmail} NOT FOUND`);
    }

    const w = await Worker.findOne({ email: demoWorkerEmail });
    if (w) {
        console.log(`Worker: ${w.email}`);
        console.log(`  ID: ${w._id}`);
        console.log(`  Coords: ${JSON.stringify(w.currentLocation?.coordinates)}`);
    } else {
        console.log(`Worker ${demoWorkerEmail} NOT FOUND`);
    }

    console.log("\n--- ACTIVE PICKUPS for Demo User ---");
    if (u) {
        const pickups = await Pickup.find({ user: u._id, status: { $in: ['scheduled', 'in-progress'] } });
        for (const p of pickups) {
            console.log(`Pickup ID: ${p._id}`);
            console.log(`  Coords: ${JSON.stringify(p.location.coordinates)}`);
            console.log(`  Address: ${p.location.address}`);
        }
    }

    process.exit(0);
}
debug();
