const mongoose = require('mongoose');
const Worker = require('./src/models/Worker');

async function debugDistance() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        const activeWorkers = await Worker.find({ status: { $in: ['active', 'on-route'] } });
        console.log(`Found ${activeWorkers.length} active workers.`);

        const finalCoords = [28.6, 77.2]; // [lng, lat] expected by the algorithm

        const getDistance = (c1, c2) => {
            const R = 6371;
            const dLat = (c2[1] - c1[1]) * Math.PI / 180;
            const dLon = (c2[0] - c1[0]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        };

        for (const worker of activeWorkers) {
            if (worker.currentLocation?.coordinates) {
                const dist = getDistance(finalCoords, worker.currentLocation.coordinates);
                console.log(`Worker ${worker._id} at ${worker.currentLocation.coordinates} is ${dist} km away.`);
            } else {
                console.log(`Worker ${worker._id} has no valid coordinates.`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debugDistance();
