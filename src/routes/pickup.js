const express = require('express');
const router = express.Router();
const Pickup = require('../models/Pickup');

// Schedule Pickup
router.post('/schedule', async (req, res) => {
    try {
        const { userId, date, slot, type, location } = req.body;

        if (!userId || !date || !slot) {
            return res.status(400).json({ message: 'Missing required fields: userId, date, or slot' });
        }

        // 1. Get User Data for Address/Location
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let finalLocation = {
            address: user.address?.street || 'Default Address',
            type: 'Point',
            coordinates: [0, 0]
        };

        if (type === 'special' && Array.isArray(location) && location.length === 2) {
            // Special pickup uses map coordinates [lat, lng] -> [lng, lat]
            finalLocation.coordinates = [location[1], location[0]];
            finalLocation.address = 'Special Location'; // Optional: could use reverse geocoding
        } else {
            // Default pickup uses user's registered address
            const userCoords = user.address?.location?.coordinates;
            // Check if coordinates exist and are NOT [0,0]
            if (userCoords && Array.isArray(userCoords) && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0)) {
                finalLocation.coordinates = userCoords;
            } else {
                finalLocation.coordinates = [76.7182, 9.1324]; // Precise CEAdoor Fallback
            }
            finalLocation.address = `${user.address?.street || ''}, ${user.address?.city || ''}`;
        }

        // Generate Simple QR (Mock)
        const qrCode = `PICKUP-${Math.floor(1000 + Math.random() * 9000)}`;

        const pickup = new Pickup({
            user: userId,
            date,
            slot,
            type,
            location: finalLocation,
            qrCode
        });

        await pickup.save();
        res.status(201).json({ message: 'Pickup scheduled', pickupId: pickup._id, qrCode });
    } catch (err) {
        console.error("Scheduling Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get User Pickups
router.get('/user/:userId', async (req, res) => {
    try {
        const pickups = await Pickup.find({ user: req.params.userId }).sort({ date: -1 });
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User's Active Pickup with Worker Location
router.get('/user/:userId/active', async (req, res) => {
    try {
        let pickup = await Pickup.findOne({ user: req.params.userId, status: { $in: ['scheduled', 'in-progress'] } })
            .populate('worker', 'name phone currentLocation status');

        // Fallback for demo tracking if no active pickup has a worker attached yet
        if (pickup && !pickup.worker) {
            const Worker = require('../models/Worker');
            const demoWorker = await Worker.findOne({ email: 'worker@segritrack.com' }) || await Worker.findOne();
            // Attach a demo worker just for map tracking visualization
            pickup = pickup.toObject();
            pickup.worker = demoWorker;
        }

        res.json(pickup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Get Assigned Pickups (Mock: fetches all scheduled for now)
router.get('/assigned', async (req, res) => {
    try {
        const pickups = await Pickup.find({ status: 'scheduled' }); // Filter by date/worker in real app
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Get Status Profile
router.get('/worker/:id/status', async (req, res) => {
    try {
        const Worker = require('../models/Worker');
        const worker = await Worker.findById(req.params.id).select('status');
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        res.json({ status: worker.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Update Online/Offline Status via REST
router.put('/worker/:id/status', async (req, res) => {
    try {
        const Worker = require('../models/Worker');
        const { isOnline } = req.body;
        const newStatus = isOnline ? 'active' : 'inactive';
        const worker = await Worker.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        console.log(`Worker ${req.params.id} status updated to: ${newStatus}`);
        res.json({ status: worker.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Update Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, segregationDetails, workerId } = req.body;

        // 1. Update the pickup status
        const pickup = await Pickup.findByIdAndUpdate(req.params.id, {
            status,
            segregationDetails,
            worker: workerId // Track which worker completed it
        }, { new: true });

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        // 2. If completed, sync worker location to this pickup's location
        if (status === 'completed' && workerId) {
            const Worker = require('../models/Worker');
            // Prevent syncing [0,0] coordinates
            if (pickup.location.coordinates && (pickup.location.coordinates[0] !== 0 || pickup.location.coordinates[1] !== 0)) {
                await Worker.findByIdAndUpdate(workerId, {
                    'currentLocation.coordinates': pickup.location.coordinates,
                    'currentLocation.lastUpdated': new Date()
                });
                console.log(`[SYNC] Worker ${workerId} location moved to completed pickup: ${pickup.location.address}`);
            } else {
                console.warn(`[SYNC] Skipped location sync for Worker ${workerId} - Pickup location was [0,0]`);
            }
        }

        res.json(pickup);
    } catch (err) {
        console.error("Status Update Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
