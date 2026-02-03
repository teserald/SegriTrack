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
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/segritrack')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const authRoutes = require('./src/routes/auth');
const pickupRoutes = require('./src/routes/pickup');
const adminRoutes = require('./src/routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', require('./src/routes/user')); // User Stats API

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    // Worker Location Update
    socket.on('updateLocation', (data) => {
        // Broadcast to specific rooms or all admins/users
        io.emit('workerLocation', data);
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
