const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Pickup = require('../models/Pickup');

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const totalPickups = await Pickup.countDocuments();
        const activeWorkers = await Worker.countDocuments({ status: 'on-route' });
        const pendingIssues = await Pickup.countDocuments({ status: 'missed' });

        res.json({
            totalPickups,
            activeWorkers,
            segregationRate: '87%', // Mocked for now, needs complex aggregation
            pendingIssues
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Workers' Locations for Live Map
router.get('/workers/locations', async (req, res) => {
    try {
        const workers = await Worker.find({}, 'name currentLocation status');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Worker
router.post('/worker', async (req, res) => {
    try {
        const worker = new Worker(req.body);
        await worker.save();
        res.status(201).json(worker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
