const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    type: { type: String, enum: ['rating', 'late_report', 'unattended_report', 'general'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    pickup: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' },
    content: String,
    ratingScore: { type: Number, min: 1, max: 5 },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
