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

// ----------------------------------------------------
// Admin Auth Middleware
// ----------------------------------------------------
const verifyAdminPassword = (req, res, next) => {
    const { adminPassword } = req.body;
    if (adminPassword === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Invalid Admin Password' });
    }
};

// ----------------------------------------------------
// Dashboard & Analytics
// ----------------------------------------------------
router.get('/stats', async (req, res) => {
    try {
        const totalPickups = await Pickup.countDocuments();
        const activeWorkers = await Worker.countDocuments({ status: { $in: ['active', 'on-route'] } });
        const pendingIssues = await Pickup.countDocuments({ status: 'missed' });
        
        // Calculate Segregation Rate
        const completedPickups = await Pickup.find({ status: 'completed' });
        let goodSegregation = 0;
        completedPickups.forEach(p => {
            if (['Excellent', 'Good'].includes(p.segregationDetails?.quality)) goodSegregation++;
        });
        const rate = completedPickups.length ? Math.round((goodSegregation / completedPickups.length) * 100) : 0;

        res.json({
            totalPickups,
            activeWorkers,
            segregationRate: `${rate}%`,
            pendingIssues
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics Route for robust charts
router.get('/analytics', async (req, res) => {
    try {
        // Top 5 Users by EcoPoints
        const topUsers = await User.find().sort({ 'points.total': -1 }).limit(5).select('name points.total points.ecoPoints');
        
        // Segregation Quality Breakdown
        const completedPickups = await Pickup.find({ status: 'completed' });
        const qualities = { Excellent: 0, Good: 0, Average: 0, Mixed: 0, Poor: 0 };
        completedPickups.forEach(p => {
            let q = p.segregationDetails?.quality || 'Average';
            if (qualities[q] !== undefined) qualities[q]++;
            else qualities['Average']++; // Default if corrupted
        });

        res.json({
            topUsers,
            qualities
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Users Management
// ----------------------------------------------------
// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User (Requires Admin Password)
router.put('/users/:id', verifyAdminPassword, async (req, res) => {
    try {
        const { name, email, points, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { name, email, points, role },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Workers Management
// ----------------------------------------------------
// Get All Workers (with details)
router.get('/workers', async (req, res) => {
    try {
        const workers = await Worker.find().select('-password');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Workers locations for live map
router.get('/workers/locations', async (req, res) => {
    try {
        const workers = await Worker.find({ status: { $in: ['active', 'on-route'] } }, 'name currentLocation status');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Worker
router.post('/workers', verifyAdminPassword, async (req, res) => {
    try {
        const worker = new Worker(req.body);
        await worker.save();
        res.status(201).json({ message: 'Worker created', worker });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Worker (Requires Admin Password)
router.put('/workers/:id', verifyAdminPassword, async (req, res) => {
    try {
        const { name, email, phone, assignedArea, status } = req.body;
        const worker = await Worker.findByIdAndUpdate(
            req.params.id, 
            { name, email, phone, assignedArea, status },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        res.json({ message: 'Worker updated successfully', worker });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Pickups Management
// ----------------------------------------------------
// Get All Pickups (Global view)
router.get('/pickups', async (req, res) => {
    try {
        const pickups = await Pickup.find()
            .populate('user', 'name address')
            .populate('worker', 'name')
            .sort({ date: -1 });
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Pickup (Requires Admin Password)
router.put('/pickups/:id', verifyAdminPassword, async (req, res) => {
    try {
        const { status, workerId, type } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (workerId) updateData.worker = workerId;
        if (type) updateData.type = type;

        const pickup = await Pickup.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        ).populate('worker', 'name');

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
        res.json({ message: 'Pickup updated successfully', pickup });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
