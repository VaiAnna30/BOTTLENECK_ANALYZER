import axios from 'axios';

async function run() {
    try {
        const payload = {
            name: "My API Test Network",
            nodes: [
                { id: '0', position: { x: 50, y: 200 }, data: { label: 'Source (0)' }, type: 'input' }
            ],
            edges: [
                { id: 'e0-1', source: '0', target: '1', label: '10 Gbps' }
            ]
        };
        const res = await axios.post('http://localhost:5000/api/network/save', payload);
        console.log("Saved!", res.data);
    } catch(e) {
        console.error("Failed to save:", e.response ? e.response.data : e.message);
    }
}
run();
