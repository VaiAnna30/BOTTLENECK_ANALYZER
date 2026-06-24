const mongoose = require('mongoose');
require('dotenv').config();

const Network = require('./models/Network');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
        const fetched = await Network.findOne({ name: "Test Network" });
        console.log("Fetched network nodes:", fetched.nodes);
        console.log("Fetched network edges:", fetched.edges);
    } catch(err) {
        console.error("Error:", err);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
