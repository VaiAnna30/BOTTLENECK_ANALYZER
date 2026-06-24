const mongoose = require('mongoose');
require('dotenv').config();

const Network = require('./models/Network');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
        const result = await Network.deleteMany({});
        console.log(`Deleted ${result.deletedCount} networks from the database.`);
    } catch(err) {
        console.error("Error:", err);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
