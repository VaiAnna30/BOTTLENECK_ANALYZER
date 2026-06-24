const express=require('express');
const {spawn}=require('child_process');
const path=require('path');
// cors -> cross origin resource sharing {Backend and Frontend Talk};
const cors = require('cors');
const mongoose=require('mongoose');
require('dotenv').config();

const Network = require('./models/Network');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// This limits the number of requestion on the API endpoints to prevent abuse and ensurefair usage.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests from this IP, please try again later." }
});

// It limits the number of simulation runs to protect the C++ engine from being overwhelmed.
const analyzeLimiter = rateLimit({
    windowMs: 1*60*1000, // 1 minute
    max: 10,
    message: { error: "Simulation rate limit exceeded. Please wait a minute before running again." }
});

app.use('/api/', apiLimiter);
app.use(cors());
app.use(express.json({limit:'50mb'}));

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

const ENGINE_PATH=process.platform==='win32'?
                    path.join(__dirname,'engine' ,'dinic_engine.exe'): 
                    path.join(__dirname,'engine','dinic_engine');

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password required" });
        
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.status(201).json({ token, username });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.json({ token, username });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/analyze', analyzeLimiter, (req, res) => {
    const {numNodes,numEdges,source,sink,edges}=req.body;
    
    // Basic structural validation
    if (numNodes == null || numEdges == null || source == null || sink == null || !Array.isArray(edges)) {
        return res.status(400).json({ error: "Invalid payload structure. Missing required graph parameters." });
    }
    
    if (edges.length > 1000 || numNodes > 1000) {
        return res.status(400).json({ error: "Graph too large. Maximum 1000 nodes/edges allowed." });
    }

    let input_string=`${numNodes} ${numEdges} ${source} ${sink}\n`;
    edges.forEach((edge)=>{
        input_string+=`${edge.u} ${edge.v} ${edge.capacity}\n`;
    });

    const engine=spawn(ENGINE_PATH);
    let output_data='';
    let error_data='';
    
    engine.stdin.write(input_string);
    engine.stdin.end();
    engine.stdout.on('data',(data)=>{
        output_data+=data.toString();
    });

    engine.stderr.on('data',(data)=>{
        error_data+=data.toString();
    });

    engine.on('close',(code)=>{
        if(code!==0||error_data){
            console.log("C++ Engine Error: ",error_data);
            return res.status(500).send({error:"Alogorithm execution Failed"});
        }

        try{
            const lines=output_data.trim().split('\n');
            const max_flow_line=lines[0];
            const max_flow=parseInt(max_flow_line.split(':')[1].trim());
            const bottleneck=[];
            const edge_flows=[];
            
            let current_section = "BOTTLENECKS";
            
            for(let i=2;i<lines.length;i++){
                const line = lines[i].trim();
                if(line === "EDGE_FLOWS:") {
                    current_section = "EDGE_FLOWS";
                    continue;
                }
                
                const parts=line.split(' ');
                if(current_section === "BOTTLENECKS" && parts.length===2){
                    bottleneck.push({
                        u:parseInt(parts[0]),
                        v:parseInt(parts[1]),
                    });
                } else if(current_section === "EDGE_FLOWS" && parts.length===3){
                    edge_flows.push({
                        u:parseInt(parts[0]),
                        v:parseInt(parts[1]),
                        flow:parseInt(parts[2])
                    });
                }
            }
            res.json({
                max_flow:max_flow,
                bottleneck:bottleneck,
                edge_flows:edge_flows
            });
        }catch(err){
            console.log("Parsing Error:",err);
            res.status(500).send({error:`Failed to Parse engine Output`});
        }
    });
});

app.post('/api/network/save', authMiddleware, async (req, res) => {
    try {
        const { name, nodes, edges } = req.body;

        const newNetwork = new Network({
            name: name || "Untitled Network",
            userId: req.user.id,
            nodes: nodes,
            edges: edges
        });
        const savedNetwork = await newNetwork.save();
        
        res.status(201).json({ 
            message: "Network saved successfully!", 
            network: savedNetwork 
        });
    } catch (error) {
        console.error("Database Save Error:", error);
        res.status(500).json({ error: "Failed to save network configuration" });
    }
});

// --- NEW ROUTE: Retrieve All Saved Networks ---
app.get('/api/network', authMiddleware, async (req, res) => {
    try {
        // Fetch all networks for the logged-in user
        const networks = await Network.find({ userId: req.user.id }).select('name createdAt').sort({ createdAt: -1 });
        
        res.status(200).json(networks);
    } catch (error) {
        console.error("Database Fetch Error:", error);
        res.status(500).json({ error: "Failed to retrieve networks" });
    }
});

// --- NEW ROUTE: Retrieve a Single Specific Network ---
app.get('/api/network/:id', authMiddleware, async (req, res) => {
    try {
        const network = await Network.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!network) {
            return res.status(404).json({ error: "Network not found or unauthorized" });
        }
        
        res.status(200).json(network);
    } catch (error) {
        console.error("Database Fetch Error:", error);
        res.status(500).json({ error: "Failed to retrieve the network" });
    }
});

// --- NEW ROUTE: Delete a Specific Network ---
app.delete('/api/network/:id', authMiddleware, async (req, res) => {
    try {
        const network = await Network.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        
        if (!network) {
            return res.status(404).json({ error: "Network not found or unauthorized" });
        }
        
        res.status(200).json({ message: "Network deleted successfully" });
    } catch (error) {
        console.error("Database Delete Error:", error);
        res.status(500).json({ error: "Failed to delete the network" });
    }
});

const PORT=process.env.PORT||5000;
if(require.main===module){
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`);
        console.log(`C++ Engine Path: ${ENGINE_PATH}`);
    });
}

module.exports=app;