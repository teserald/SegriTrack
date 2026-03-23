require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// DEBUG: Log every request
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url} content-type: ${req.headers['content-type'] || 'none'}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/segritrack')
    .then(async () => {
        console.log('MongoDB Connected');
        const seedDemoPickups = require('./src/utils/seedDemo');
        await seedDemoPickups();
    })
    .catch(err => console.log(err));

const authRoutes = require('./src/routes/auth');
const pickupRoutes = require('./src/routes/pickup');
const adminRoutes = require('./src/routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', require('./src/routes/user')); // User Stats API

// Worker Status API (direct routes to avoid routing conflicts)
const Worker = require('./src/models/Worker');

app.get('/api/worker/:id/status', async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).select('status');
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        res.json({ status: worker.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/worker/:id/status', async (req, res) => {
    try {
        const { isOnline } = req.body;
        const newStatus = isOnline ? 'active' : 'inactive';
        const worker = await Worker.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
        if (!worker) return res.status(404).json({ message: 'Worker not found' });
        console.log(`[REST] Worker ${req.params.id} status => ${newStatus}`);
        res.json({ status: worker.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    // Worker Location Update
    socket.on('updateLocation', async (data) => {
        try {
            const Worker = require('./src/models/Worker');
            if (data.workerId && data.workerId.match(/^[0-9a-fA-F]{24}$/)) {
                await Worker.findByIdAndUpdate(data.workerId, {
                    'currentLocation.coordinates': [data.lng, data.lat], // GeoJSON is [lng, lat]
                    'currentLocation.lastUpdated': new Date()
                });
            }
        } catch (e) {
            console.error('Error saving location', e);
        }
        // Broadcast to specific rooms or all admins/users
        io.emit('workerLocation', data);
    });

    // Worker Status Update (Online/Offline)
    socket.on('workerStatusUpdate', async (data) => {
        try {
            const Worker = require('./src/models/Worker');
            if (data.workerId && data.workerId.match(/^[0-9a-fA-F]{24}$/)) {
                await Worker.findByIdAndUpdate(data.workerId, {
                    status: data.isOnline ? 'active' : 'inactive'
                });
            }
        } catch (e) {
            console.error('Error updating worker status', e);
        }
        // Broadcast to specific rooms or all admins/users
        io.emit('workerStatusUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/user/index.html'));
});

// User Routes
app.get('/user/*', (req, res) => {
    // Basic catch-all to serve user files if accessed directly via /user/filename.html
    const filename = req.params[0];
    res.sendFile(path.join(__dirname, 'public/user', filename));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
