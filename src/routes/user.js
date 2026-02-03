const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- Helper: Safely Calculate Points ---
const calculatePoints = (user) => {
    if (!user.points) {
        user.points = { total: 0, ecoPoints: 0, gems: 0 };
    }
    const eco = user.points.ecoPoints || 0;
    const gems = user.points.gems || 0;
    // Formula: (Eco/4) + (5*Gems)
    return Math.round((eco / 4) + (5 * gems));
};

// 1. GET User Dashboard Stats
router.get('/stats/:userId', async (req, res) => {
    try {
        if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const calculatedTotal = calculatePoints(user);

        // Sync if needed
        if (user.points.total !== calculatedTotal) {
            user.points.total = calculatedTotal;
            await user.save();
        }

        res.json(user.points);
    } catch (err) {
        console.error("Stats API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. GET User Profile (Full Details)
router.get('/profile/:userId', async (req, res) => {
    try {
        if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const calculatedTotal = calculatePoints(user);

        if (user.points.total !== calculatedTotal) {
            user.points.total = calculatedTotal;
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error("Profile API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. GET Leaderboard (Top 20)
router.get('/leaderboard', async (req, res) => {
    try {
        const leaders = await User.find({})
            .sort({ 'points.total': -1 })
            .limit(20)
            .select('name points'); // Only send necessary fields

        res.json(leaders);
    } catch (err) {
        console.error("Leaderboard API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4. GET Global Impact Stats
router.get('/impact', async (req, res) => {
    res.json({
        wasteCollected: '5,200 Kg',
        rewardsDistributed: '₹1.2 Lakh',
        treesSaved: '1,400+'
    });
});

module.exports = router;
