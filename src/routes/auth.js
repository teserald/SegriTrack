const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // In real app, hash password here
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unified Login Route (User & Worker)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check User Collection
        const user = await User.findOne({ email });
        if (user && user.password === password) {
            return res.json({
                message: 'Login successful',
                id: user._id,
                role: 'user',
                name: user.name
            });
        }

        // 2. Check Worker Collection
        const worker = await Worker.findOne({ email });
        if (worker && worker.password === password) {
            return res.json({
                message: 'Worker Login successful',
                id: worker._id,
                role: 'worker',
                name: worker.name
            });
        }

        // 3. Fallback (Admin Check - Mock for MVP)
        if (email === 'admin' && password === 'admin') {
            return res.json({
                message: 'Admin Login',
                id: 'admin',
                role: 'admin',
                name: 'Administrator'
            });
        }

        return res.status(400).json({ message: 'Invalid credentials' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Demo Login Route (For College Project Presentation)
router.post('/demo-login', async (req, res) => {
    try {
        const { role } = req.body;

        if (role === 'worker') {
            // Use the standard seeded worker
            let worker = await Worker.findOne({ email: 'worker@segritrack.com' });
            if (!worker) {
                // Fallback if seed didn't run
                worker = new Worker({
                    name: 'Ramesh Worker (Demo)',
                    email: 'worker@segritrack.com',
                    password: 'password',
                    phone: '9876543210',
                    assignedArea: 'Demo Area',
                    status: 'active'
                });
                await worker.save();
            }
            return res.json({
                message: 'Demo Worker Login successful',
                id: worker._id,
                role: 'worker',
                name: worker.name
            });
        } else {
            // Use the standard seeded user
            let user = await User.findOne({ email: 'user@segritrack.com' });
            if (!user) {
                user = new User({
                    name: 'Adithya User (Demo)',
                    email: 'user@segritrack.com',
                    password: 'password',
                    address: {
                        street: 'College of Engineering Adoor, Manakala',
                        city: 'Adoor',
                        zip: '691523',
                        location: {
                            type: 'Point',
                            coordinates: [76.7182, 9.1324]
                        }
                    }
                });
                await user.save();
            }
            return res.json({
                message: 'Demo User Login successful',
                id: user._id,
                role: 'user',
                name: user.name
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
