const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testGeofence() {
    try {
        await mongoose.connect('mongodb://localhost:27017/segritrack');
        const user = await User.findOne({ email: 'user@segritrack.com' });

        console.log("Testing Geofenced Scheduling...");

        // Attempt scheduling far away (e.g. New Delhi coordinates ~28.6,-77.2)
        // Expected: 400 Bad Request
        const url = 'http://localhost:3000/api/pickup/schedule';
        const payload = {
            userId: user._id,
            type: 'special',
            date: '2026-10-10',
            slot: 'Morning',
            location: [77.2, 28.6]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 400 && data.message.includes('No worker available')) {
            console.log("✅ PASSED: Server correctly blocked scheduling out of range.");
            console.log(`   Message received: "${data.message}"`);
            process.exit(0);
        } else if (response.ok) {
            console.log("❌ FAILED: Scheduled successfully despite being thousands of miles away.");
            process.exit(1);
        } else {
            console.log(`❌ FAILED: Unexpected error ${response.status}: ${data.message || 'Unknown'}`);
            process.exit(1);
        }

    } catch (e) {
        console.error("Setup failed", e.message);
        process.exit(1);
    }
}

testGeofence();
