#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>

using namespace std;

// Generates a Washington/GenRMF-style layered network for DIMACS
int main(int argc, char* argv[]) {
    // 1. Handle command line arguments
    if (argc != 4) {
        cerr << "Usage: " << argv[0] << " <Layers> <Width> <MaxCapacity>\n";
        cerr << "Example: " << argv[0] << " 100 50 1000\n";
        return 1;
    }

    int layers = atoi(argv[1]);
    int width = atoi(argv[2]);
    int max_cap = atoi(argv[3]);

    if (layers < 2 || width < 2) return 1;

    // Node 1 is Source. The last node is the Sink.
    int num_nodes = layers * width + 2;
    int source = 1;
    int sink = num_nodes;

    srand(time(NULL));

    struct Edge { int u, v, cap; };
    vector<Edge> edges;

    // 2. Connect Source to Layer 1
    for (int i = 0; i < width; i++) {
        int v = 2 + i; // Layer 1 starts at node 2
        edges.push_back({source, v, rand() % max_cap + 1});
    }

    // 3. Connect the inner Layers
    for (int l = 0; l < layers - 1; l++) {
        int layer_start = 2 + l * width;
        int next_layer_start = layer_start + width;

        for (int i = 0; i < width; i++) {
            int u = layer_start + i;
            
            // Connect to 3 random nodes in the next layer
            for (int k = 0; k < 3; k++) {
                int v = next_layer_start + (rand() % width);
                edges.push_back({u, v, rand() % max_cap + 1});
            }
            
            // 20% chance to create an intra-layer cycle (makes it harder for Dinic's)
            if (rand() % 100 < 20) {
                int v = layer_start + (rand() % width);
                if (u != v) edges.push_back({u, v, rand() % max_cap + 1});
            }
        }
    }

    // 4. Connect the Last Layer to the Sink
    int last_layer_start = 2 + (layers - 1) * width;
    for (int i = 0; i < width; i++) {
        int u = last_layer_start + i;
        edges.push_back({u, sink, rand() % max_cap + 1});
    }

    // 5. Output strictly in the official DIMACS .max format
    cout << "c Modern Washington-Style Layered Network Generator\n";
    cout << "p max " << num_nodes << " " << edges.size() << "\n";
    cout << "n " << source << " s\n";
    cout << "n " << sink << " t\n";

    for (const auto& e : edges) {
        cout << "a " << e.u << " " << e.v << " " << e.cap << "\n";
    }

    return 0;
}