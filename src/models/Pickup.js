const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    date: { type: Date, required: true },
    slot: { type: String, required: true },
    type: { type: String, enum: ['default', 'special'], default: 'default' },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'missed', 'unattended', 'reassigned'], default: 'scheduled' },
    location: {
        address: String,
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    segregationDetails: {
        quality: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor', 'Unsegregated'] },
        feedback: String,
        photoUrl: String
    },
    qrCode: { type: String, unique: true }, // Unique token for verification
    issueReport: {
        type: { type: String, enum: ['late_reassigned', 'unattended', 'none'], default: 'none' },
        reportedAt: Date,
        photoUrl: String,
        originalWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }
    },
    createdAt: { type: Date, default: Date.now }
});

PickupSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Pickup', PickupSchema);
