const fs = require('fs');
const path = require('path');

/**
 * Converts a standard DIMACS .max text file into the JSON payload format expected by the Node API.
 * @param {string} inputFileName - The name of the raw .max file in the datasets folder.
 * @param {string} outputFileName - The target name for the generated .json file.
 * @param {number} expectedMaxFlow - The known benchmark answer (can be 0 if unknown/randomized).
 */
function convertDimacsToJson(inputFileName, outputFileName, expectedMaxFlow = 0) {
    const inputPath = path.join(__dirname, '..', 'tests', 'datasets', inputFileName);
    const outputPath = path.join(__dirname, '..', 'tests', 'datasets', outputFileName);

    console.log(`\n==================================================`);
    console.log(`🚀 Starting DIMACS Parsing Loop...`);
    console.log(`📂 Reading: ${inputPath}`);
    
    // 1. Check if source file exists
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ ERROR: The file "${inputFileName}" does not exist in tests/datasets/`);
        return;
    }

    // 2. Read the entire text file into memory and split into lines
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const lines = rawData.split('\n');

    let numNodes = 0;
    let numEdges = 0;
    let source = -1;
    let sink = -1;
    const edges = [];

    // 3. Process line-by-line using standard structural mapping
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip completely empty lines or comment descriptors
        if (!line || line.startsWith('c')) continue;

        // Split by any number of consecutive whitespace characters
        const parts = line.split(/\s+/);

        switch (parts[0]) {
            case 'p':
                // Problem Line Descriptor: p max [nodes] [edges]
                numNodes = parseInt(parts[2], 10);
                numEdges = parseInt(parts[3], 10);
                break;

            case 'n':
                // Node Descriptor: n [node_id] [s|t]
                // Shift down by 1 to adapt to C++ 0-indexed vectors
                if (parts[2] === 's') {
                    source = parseInt(parts[1], 10) - 1;
                } else if (parts[2] === 't') {
                    sink = parseInt(parts[1], 10) - 1;
                }
                break;

            case 'a':
                // Arc Descriptor: a [u] [v] [capacity]
                // Shift both nodes down by 1 to maintain structural integrity in C++
                edges.push({
                    u: parseInt(parts[1], 10) - 1,
                    v: parseInt(parts[2], 10) - 1,
                    capacity: parseInt(parts[3], 10)
                });
                break;

            default:
                // Ignore unknown descriptors gracefully
                break;
        }
    }

    // 4. Validate that a structural bottleneck calculation is possible
    if (source === -1 || sink === -1) {
        console.error(`❌ PARSING ERROR: Source (s) or Sink (t) descriptors were missing!`);
        return;
    }

    // 5. Structure the finalized test object
    const jsonOutput = {
        name: inputFileName,
        expectedMaxFlow: expectedMaxFlow,
        payload: {
            numNodes,
            numEdges,
            source,
            sink,
            edges
        }
    };

    // 6. Persist file to drive
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    
    console.log(`✅ SUCCESS: Matrix translation complete.`);
    console.log(`📊 Nodes Parsed: ${numNodes} | Edges Emitted: ${edges.length}`);
    console.log(`💾 Saved directly to: ${outputPath}`);
    console.log(`==================================================\n`);
}

// Executing translation on your newly generated Washington Layered Network
convertDimacsToJson('stress_test.max', 'stress_test.json', 0);

module.exports = convertDimacsToJson;