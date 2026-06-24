const mongoose = require('mongoose');
require('dotenv').config();

const Network = require('./models/Network');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
        const fetched = await Network.findOne({ name: "US East CDN Config" });
        if(fetched) {
            console.log("Fetched network nodes:", JSON.stringify(fetched.nodes, null, 2));
            console.log("Fetched network edges:", JSON.stringify(fetched.edges, null, 2));
        } else {
            console.log("Network not found");
        }
    } catch(err) {
        console.error("Error:", err);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
