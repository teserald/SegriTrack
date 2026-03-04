require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Worker = require('../src/models/Worker');
const Pickup = require('../src/models/Pickup');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/segritrack', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for Seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Worker.deleteMany({});
        await Pickup.deleteMany({});

        // 1. Create Main Demo User (Standardized Name)
        const user1 = await User.create({
            name: 'Demo User',
            email: 'user@segritrack.com',
            password: 'password',
            address: {
                street: '123 Green Way',
                city: 'Adoor',
                location: { type: 'Point', coordinates: [76.7356, 9.1529] }
            },
            points: { total: 170, ecoPoints: 400, gems: 14 }
        });
        console.log('Demo User created (170 Pts)');

        // 2. Create Leaderboard Users (User 1 to User 20)
        let leaderUsers = [];

        // Ranks 1 to 20
        for (let i = 1; i <= 20; i++) {
            const total = 500 - (i * 12); // Proportional drop

            // Avoid negative points
            const safeTotal = Math.max(0, total);

            // Reverse engineer Eco/Gems. Gems = 10 (50pts). Rest is Eco.
            const gems = 10;
            const eco = (safeTotal - 50) * 4;

            leaderUsers.push({
                name: `User ${i}`,
                email: `user${i}@test.com`,
                password: 'password',
                points: {
                    total: safeTotal,
                    ecoPoints: Math.max(0, eco),
                    gems: gems
                }
            });
        }

        await User.insertMany(leaderUsers);
        console.log('Leaderboard Users created (User 1 - User 20)');

        // 3. Create Demo Worker (Standardized Name)
        const worker1 = await Worker.create({
            name: 'Demo Worker',
            email: 'worker@segritrack.com',
            password: 'password',
            assignedArea: 'Adoor-West',
            status: 'active',
            currentLocation: { type: 'Point', coordinates: [76.7456, 9.1629] }
        });
        console.log('Demo Worker created');

        // 4. Create Generic Workers
        await Worker.create({
            name: 'Worker 1',
            email: 'worker1@segritrack.com',
            password: 'password',
            assignedArea: 'Adoor-East',
            status: 'active',
            currentLocation: { type: 'Point', coordinates: [76.7556, 9.1729] }
        });
        console.log('Generic Workers created');

        // 5. Create Pickups
        await Pickup.create({
            user: user1._id,
            worker: worker1._id,
            date: new Date(),
            slot: 'Morning (08:00 - 10:00)',
            type: 'default',
            status: 'scheduled',
            location: {
                address: '123 Green Way, Adoor',
                type: 'Point',
                coordinates: [76.7356, 9.1529]
            },
            qrCode: 'PICKUP-101'
        });

        await Pickup.create({
            user: user1._id,
            worker: worker1._id,
            date: new Date(Date.now() + 86400000), // Tomorrow
            slot: 'Afternoon (02:00 - 04:00)',
            type: 'special',
            status: 'scheduled',
            location: {
                address: 'Custom Spot, Adoor',
                type: 'Point',
                coordinates: [76.7556, 9.1729]
            },
            qrCode: 'PICKUP-102'
        });

        console.log('Pickups created');
        console.log('-----------------------------------');
        console.log('SEEDING COMPLETE');
        console.log('Demo User: user@segritrack.com / password');
        console.log('Demo Worker: worker@segritrack.com / password');
        console.log('-----------------------------------');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
