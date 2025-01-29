const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomcode: { type: String, required: true, unique: true},
    users: [
        {
            _id: { type: String, required: true },
            username: { type: String, required: true, index: true },
            color: { type: String, required: true },
            joinedAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Room', roomSchema);
