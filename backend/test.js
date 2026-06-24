const mongoose = require('mongoose');
require('dotenv').config();

const Network = require('./models/Network');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const newNetwork = new Network({
        name: "Test Network",
        nodes: [{ id: '1', data: { label: 'Node 1' }, position: { x: 0, y: 0 }, type: 'input' }],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
    });

    try {
        const saved = await newNetwork.save();
        console.log("Saved successfully:", saved);

        const fetched = await Network.find();
        console.log("Fetched networks count:", fetched.length);
    } catch(err) {
        console.error("Error:", err);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
