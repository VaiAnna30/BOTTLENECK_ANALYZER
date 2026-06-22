const express=require('express');
const {spawn}=require('child_process');
const path=require('path');
const cors = require('cors');
const mongoose=require('mongoose');
require('dotenv').config();

const Network=require('./models/Network');

const app=express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const ENGINE_PATH=process.platform==='win32'?
                    path.join(__dirname,'engine' ,'dinic_engine.exe'): 
                    path.join(__dirname,'engine','dinic_engine');

app.post('/api/analyze',(req,res)=>{
    const {numNodes,numEdges,source,sink,edges}=req.body;
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
            
            for(let i=2;i<lines.length;i++){
                const parts=lines[i].trim().split(' ');
                if(parts.length===2){
                    bottleneck.push({
                        u:parseInt(parts[0]),
                        v:parseInt(parts[1]),
                    });
                }
            }

            res.json({
                max_flow:max_flow,
                bottleneck:bottleneck
            });
        }catch(err){
            console.log("Parsing Error:",err);
            res.status(500).send({error:`Failed to Parse engine Output`});
        }
    });
});

// --- NEW ROUTE: Save a Network Configuration ---
app.post('/api/network/save', async (req, res) => {
    try {
        const { name, nodes, edges } = req.body;

        // Create a new database entry using your Schema
        const newNetwork = new Network({
            name: name || "Untitled Network",
            nodes: nodes,
            edges: edges
        });

        // Save it to MongoDB Atlas
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

const PORT=process.env.PORT||5000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
    console.log(`C++ Engine Path: ${ENGINE_PATH}`);
});