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

        // 2. Geofencing Restriction Check
        const Worker = require('../models/Worker');
        const activeWorkers = await Worker.find({ status: { $in: ['active', 'on-route'] } });

        let workerInRange = false;
        if (activeWorkers.length > 0) {
            // Helper: Haversine distance in km
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
                    const dist = getDistance(finalLocation.coordinates, worker.currentLocation.coordinates);
                    if (dist <= 10) { // 10 km max radius
                        workerInRange = true;
                        break;
                    }
                }
            }
        }

        if (!workerInRange) {
            return res.status(400).json({ message: 'No worker available in your area (within 10km).' });
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

// Worker: Get Completed Pickups (History)
router.get('/worker/:workerId/history', async (req, res) => {
    try {
        const history = await Pickup.find({ 
            worker: req.params.workerId, 
            status: 'completed' 
        }).sort({ date: -1 }).populate('user', 'name'); // sort by newest first
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker: Get Assigned Pickups with Geofencing and Route Optimization
router.get('/assigned', async (req, res) => {
    try {
        const { workerId, radiusKm = 10 } = req.query;
        // Fetch all scheduled pickups
        let pickups = await Pickup.find({ status: 'scheduled' }).populate('user', 'name phone');

        // Find worker's current location to act as the starting point
        let workerLocation = null;
        if (workerId) {
            const Worker = require('../models/Worker');
            const worker = await Worker.findById(workerId);
            if (worker && worker.currentLocation?.coordinates) {
                workerLocation = worker.currentLocation.coordinates; // [lng, lat]
            }
        }

        if (workerLocation) {
            // Helper: Haversine distance in km
            const getDistance = (c1, c2) => {
                const R = 6371;
                const dLat = (c2[1] - c1[1]) * Math.PI / 180;
                const dLon = (c2[0] - c1[0]) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            };

            // 1. Geofencing: Filter out pickups outside the radius
            const filteredPickups = [];
            for (const p of pickups) {
                if (!p.location?.coordinates || (p.location.coordinates[0] === 0 && p.location.coordinates[1] === 0)) continue;

                const dist = getDistance(workerLocation, p.location.coordinates);
                if (dist <= parseFloat(radiusKm)) {
                    let pObj = p.toObject();
                    pObj.directDistance = dist.toFixed(2);
                    filteredPickups.push(pObj);
                }
            }

            // 2. Route Optimization (Time-Slot Priority + Exact TSP/NN Fallback)
            if (filteredPickups.length > 0) {
                // Parse and Group Pickups Chronologically
                const timeGroups = {};
                filteredPickups.forEach(p => {
                    const slotText = p.slot || 'ASAP';
                    let sortKey = 9999; // Default late

                    if (slotText !== 'ASAP') {
                        // Extract e.g., "09:00 AM" or "01:00 PM"
                        const match = slotText.match(/(\d{2}):(\d{2})\s*(AM|PM)/i);
                        if (match) {
                            let [, h, m, meridiem] = match;
                            h = parseInt(h);
                            if (meridiem.toUpperCase() === 'PM' && h !== 12) h += 12;
                            if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
                            sortKey = h * 100 + parseInt(m);
                        }
                    }

                    if (!timeGroups[sortKey]) timeGroups[sortKey] = [];
                    timeGroups[sortKey].push(p);
                });

                // Sort the groups chronologically
                const sortedKeys = Object.keys(timeGroups).map(Number).sort((a, b) => a - b);

                let sortedPickups = [];
                let globalStartLocation = workerLocation;

                // Process each time slot group sequentially
                for (const key of sortedKeys) {
                    const groupPickups = timeGroups[key];
                    const points = [globalStartLocation, ...groupPickups.map(p => p.location.coordinates)];
                    const n = points.length;

                    if (n === 1) continue; // Array only contains start location

                    // Distance Matrix for this group
                    const distMatrix = Array(n).fill(null).map(() => Array(n).fill(0));
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < n; j++) {
                            if (i !== j) {
                                distMatrix[i][j] = getDistance(points[i], points[j]);
                            }
                        }
                    }

                    if (groupPickups.length <= 10) {
                        // EXACT TSP (Branch and Bound / DFS) for this group
                        let bestRoute = [];
                        let bestDistance = Infinity;

                        const dfs = (currNode, visited, currentDist, path) => {
                            if (visited === (1 << n) - 1) {
                                if (currentDist < bestDistance) {
                                    bestDistance = currentDist;
                                    bestRoute = [...path];
                                }
                                return;
                            }

                            for (let nextNode = 1; nextNode < n; nextNode++) {
                                if ((visited & (1 << nextNode)) === 0) {
                                    const newDist = currentDist + distMatrix[currNode][nextNode];
                                    if (newDist < bestDistance) {
                                        path.push(nextNode);
                                        dfs(nextNode, visited | (1 << nextNode), newDist, path);
                                        path.pop();
                                    }
                                }
                            }
                        };

                        dfs(0, 1, 0, []);

                        let lastLocation = globalStartLocation;
                        for (let i = 0; i < bestRoute.length; i++) {
                            const pickup = groupPickups[bestRoute[i] - 1]; // index offset
                            const distToThis = getDistance(lastLocation, pickup.location.coordinates);

                            pickup.routingOrder = sortedPickups.length + 1;
                            pickup.distanceFromPrev = distToThis.toFixed(2);

                            sortedPickups.push(pickup);
                            lastLocation = pickup.location.coordinates;
                        }
                        globalStartLocation = lastLocation; // Carry over to next time slot group

                    } else {
                        // FALLBACK: Nearest Neighbor for large groups
                        let unvisited = [...groupPickups];
                        let currentLocation = globalStartLocation;

                        while (unvisited.length > 0) {
                            let nearestIdx = 0;
                            let minDistance = Infinity;

                            for (let i = 0; i < unvisited.length; i++) {
                                const dist = getDistance(currentLocation, unvisited[i].location.coordinates);
                                if (dist < minDistance) {
                                    minDistance = dist;
                                    nearestIdx = i;
                                }
                            }

                            const nearestPickup = unvisited[nearestIdx];
                            nearestPickup.routingOrder = sortedPickups.length + 1;
                            nearestPickup.distanceFromPrev = minDistance.toFixed(2);

                            sortedPickups.push(nearestPickup);
                            currentLocation = nearestPickup.location.coordinates;
                            unvisited.splice(nearestIdx, 1);
                        }
                        globalStartLocation = currentLocation; // Carry over
                    }
                }

                pickups = sortedPickups;
            } else {
                pickups = []; // Empty if none within radius
            }
        }

        res.json(pickups);
    } catch (err) {
        console.error("Assigned Pickups Optimization Error:", err);
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

        // 2. If completed, sync worker location to this pickup's location and award points
        if (status === 'completed') {
            // A. Sync Worker Location
            if (workerId) {
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

            // B. Award Points to User
            const User = require('../models/User');
            const user = await User.findById(pickup.user);
            if (user) {
                if (!user.points) user.points = { total: 0, ecoPoints: 0, gems: 0 };
                
                let earnedEco = 0;
                let earnedGems = 0;
                
                const quality = segregationDetails?.quality || 'Average';
                
                // Demo Points Logic based on Quality
                if (quality === 'Excellent') {
                    earnedEco = 50;
                    earnedGems = 2;
                } else if (quality === 'Good' || quality === 'Average') {
                    earnedEco = 20;
                    earnedGems = 1;
                } else {
                    earnedEco = 5;
                    earnedGems = 0;
                }
                
                // Delay points by 24h
                setTimeout(async () => {
                    try {
                        const fetchedUser = await User.findById(user._id);
                        if(fetchedUser) {
                            fetchedUser.points.ecoPoints += earnedEco;
                            fetchedUser.points.gems += earnedGems;
                            fetchedUser.points.total = Math.round((fetchedUser.points.ecoPoints / 4) + (5 * fetchedUser.points.gems));
                            await fetchedUser.save();
                            console.log(`[REWARDS DELAYED] Awarded pending ${earnedEco} Eco, ${earnedGems} Gems to User ${fetchedUser._id}.`);
                        }
                    } catch(e) {}
                }, 24 * 60 * 60 * 1000);
                
                console.log(`[REWARDS PENDING] ${earnedEco} Eco, ${earnedGems} Gems to User ${user._id} pending for 24 hours.`);
            }
        }

        res.json(pickup);
    } catch (err) {
        console.error("Status Update Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Worker: Arrived at Pickup (Sync Location early)
router.put('/:id/arrive', async (req, res) => {
    try {
        const { workerId } = req.body;
        const pickup = await Pickup.findById(req.params.id);
        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        if (workerId && pickup.location?.coordinates && (pickup.location.coordinates[0] !== 0 || pickup.location.coordinates[1] !== 0)) {
            const Worker = require('../models/Worker');
            await Worker.findByIdAndUpdate(workerId, {
                'currentLocation.coordinates': pickup.location.coordinates,
                'currentLocation.lastUpdated': new Date()
            });
            console.log(`[SYNC] Worker ${workerId} ARRIEVED at pickup: ${pickup.location.address}`);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Arrive Update Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// User: Request Reassignment (Worker is too late)
router.post('/:id/reassign', async (req, res) => {
    try {
        const pickupId = req.params.id;
        const pickup = await Pickup.findById(pickupId).populate('worker', 'name');
        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
        
        const originalWorkerId = pickup.worker ? pickup.worker._id : null;
        
        const Worker = require('../models/Worker');
        const activeWorkers = await Worker.find({ 
            status: { $in: ['active', 'on-route'] },
            _id: { $ne: originalWorkerId }
        });
        
        let nearestWorker = null;
        let minDistance = Infinity;
        
        if (activeWorkers.length > 0 && pickup.location?.coordinates) {
            const getDistance = (c1, c2) => {
                const R = 6371;
                const dLat = (c2[1] - c1[1]) * Math.PI / 180;
                const dLon = (c2[0] - c1[0]) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(c1[1] * Math.PI / 180) * Math.cos(c2[1] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
            };
            
            for (const worker of activeWorkers) {
                if (worker.currentLocation?.coordinates) {
                    const dist = getDistance(pickup.location.coordinates, worker.currentLocation.coordinates);
                    if (dist < minDistance && dist <= 15) {
                        minDistance = dist;
                        nearestWorker = worker;
                    }
                }
            }
        }
        
        if (!nearestWorker) {
            return res.status(400).json({ message: 'No alternative workers available nearby. Please try again later.' });
        }
        
        pickup.worker = nearestWorker._id;
        pickup.status = 'reassigned'; 
        pickup.issueReport = {
            type: 'late_reassigned',
            reportedAt: new Date(),
            originalWorker: originalWorkerId
        };
        await pickup.save();
        
        const newPickup = await Pickup.findById(pickupId).populate('worker', 'name phone currentLocation status');
        
        const io = req.app.get('io');
        if (io) {
            io.emit('pickupReassigned', { pickupId, newWorkerId: nearestWorker._id, oldWorkerId: originalWorkerId });
        }
        
        res.json({ message: 'Reassigned successfully', pickup: newPickup });
    } catch (err) {
        console.error("Reassign Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// User: Mark as Unattended (Secure & Leave)
router.post('/:id/unattended', async (req, res) => {
    try {
        const { photoUrl } = req.body;
        const pickupId = req.params.id;
        
        const pickup = await Pickup.findById(pickupId);
        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
        
        pickup.status = 'unattended';
        pickup.issueReport = {
            type: 'unattended',
            reportedAt: new Date(),
            photoUrl: photoUrl || 'dummy_url.jpg',
            originalWorker: pickup.worker
        };
        await pickup.save();
        
        const io = req.app.get('io');
        if (io) {
            io.emit('pickupUnattended', { pickupId, workerId: pickup.worker });
        }
        
        res.json({ message: 'Unattended pickup secured', pickup });
    } catch (err) {
        console.error("Unattended Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// User: Rate Worker post-pickup
router.post('/worker/:id/rate', async (req, res) => {
    try {
        const { userId, pickupId, score, tags, comment } = req.body;
        const Worker = require('../models/Worker');
        const worker = await Worker.findById(req.params.id);
        
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        
        worker.ratings.push({
            user: userId,
            pickup: pickupId,
            score: Number(score),
            tags: tags || [],
            comment: comment || ''
        });
        
        const total = worker.ratings.reduce((acc, r) => acc + r.score, 0);
        worker.averageRating = Number((total / worker.ratings.length).toFixed(1));
        
        await worker.save();
        
        res.json({ message: 'Rating submitted', averageRating: worker.averageRating });
    } catch (err) {
        console.error("Rating Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
