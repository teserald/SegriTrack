const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: {
        street: String,
        city: String,
        zip: String,
        location: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
        }
    },
    points: {
        total: { type: Number, default: 0 },
        ecoPoints: { type: Number, default: 0 },
        gems: { type: Number, default: 0 }
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ 'address.location': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
