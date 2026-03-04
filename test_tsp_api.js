const mongoose = require('mongoose');
const Worker = require('./src/models/Worker');

async function testApi() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        const worker = await Worker.findOne({ email: 'worker@segritrack.com' });
        if (!worker) {
            console.error("Worker not found");
            process.exit(1);
        }

        console.log(`Worker ID: ${worker._id}`);
        console.log(`Worker Location: ${JSON.stringify(worker.currentLocation.coordinates)}`);

        const url = `http://localhost:3000/api/pickup/assigned?workerId=${worker._id}&radiusKm=10`;
        console.log(`Fetching from: ${url}`);

        const response = await fetch(url);
        const data = await response.json();

        console.log(`\nReturned ${data.length} optimized pickups:`);
        data.forEach((p, index) => {
            console.log(`\n[Stop ${index + 1}] ${p.location.address}`);
            console.log(`   Expected Routing Order: ${p.routingOrder}`);
            console.log(`   Direct Distance from Worker: ${p.directDistance} km`);
            console.log(`   Distance from Previous Stop: ${p.distanceFromPrev} km`);
            console.log(`   Coordinates: ${JSON.stringify(p.location.coordinates)}`);
        });

        process.exit(0);
    } catch (e) {
        console.error("Test failed", e.message);
        process.exit(1);
    }
}

testApi();
