const mongoose = require('mongoose');

const NetworkSchema = new mongoose.Schema({
    name: { 
        type: String, 
        default: "Untitled Network" 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nodes: [mongoose.Schema.Types.Mixed],
    edges: [mongoose.Schema.Types.Mixed],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Network', NetworkSchema);