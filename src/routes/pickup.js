const express = require('express');
const router = express.Router();
const Pickup = require('../models/Pickup');

// Schedule Pickup
router.post('/schedule', async (req, res) => {
    try {
        const { userId, date, slot, type, location } = req.body;

        // Generate Simple QR (Mock)
        const qrCode = `PICKUP-${Math.floor(1000 + Math.random() * 9000)}`;

        const pickup = new Pickup({
            user: userId,
            date,
            slot,
            type,
            location,
            qrCode
        });
        await pickup.save();
        res.status(201).json({ message: 'Pickup scheduled', pickupId: pickup._id, qrCode });
    } catch (err) {
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

// Worker: Get Assigned Pickups (Mock: fetches all scheduled for now)
router.get('/assigned', async (req, res) => {
    try {
        const pickups = await Pickup.find({ status: 'scheduled' }); // Filter by date/worker in real app
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Update Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, segregationDetails } = req.body;
        const pickup = await Pickup.findByIdAndUpdate(req.params.id, {
            status,
            segregationDetails
        }, { new: true });
        res.json(pickup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
