const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    assignedArea: { type: String },
    currentLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
        lastUpdated: { type: Date }
    },
    status: { type: String, enum: ['active', 'inactive', 'on-route'], default: 'inactive' },
    createdAt: { type: Date, default: Date.now }
});

WorkerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Worker', WorkerSchema);
