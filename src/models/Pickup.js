const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    date: { type: Date, required: true },
    slot: { type: String, required: true },
    type: { type: String, enum: ['default', 'special'], default: 'default' },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'missed'], default: 'scheduled' },
    location: {
        address: String,
        coordinates: { type: [Number] }
    },
    segregationDetails: {
        quality: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor', 'Unsegregated'] },
        feedback: String,
        photoUrl: String
    },
    qrCode: { type: String, unique: true }, // Unique token for verification
    createdAt: { type: Date, default: Date.now }
});

PickupSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Pickup', PickupSchema);
