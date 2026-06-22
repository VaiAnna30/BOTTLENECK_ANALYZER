#include<bits/stdc++.h>
using namespace std;

void fast_io() {
    #ifndef ONLINE_JUDGE
        // freopen("inputf.txt", "r", stdin);
        // freopen("outputff.txt", "w", stdout);
    #endif
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
}

struct Edge {
    int to;
    int flow;
    int capacity;
    int rev_index;
};

class Dinic {
private:
    int num_nodes;
    vector<int> level;
    vector<int> ptr;
    vector<vector<Edge>> adj;

public:
    Dinic(int n) {
        num_nodes = n;
        level.resize(n);
        ptr.resize(n);
        adj.resize(n);
    }

    void add_edge(int u, int v, int cap) {
        adj[u].push_back({v, 0, cap, (int)adj[v].size()});
        adj[v].push_back({u, 0, 0, (int)adj[u].size() - 1});
    }

    bool build_level_graph(int source, int sink) {
        fill(level.begin(), level.end(), -1);
        level[source] = 0;
        queue<int> q;
        q.push(source);

        while (!q.empty()) {
            int node = q.front();
            q.pop();

            for (auto &edge : adj[node]) {
                int remaining_capacity = edge.capacity - edge.flow;
                if (remaining_capacity > 0 && level[edge.to] == -1) {
                    level[edge.to] = level[node] + 1;
                    q.push(edge.to);
                }
            }
        }
        return level[sink] != -1;
    }

    int push_water(int current, int sink, int incoming_water) {
        if (incoming_water == 0) return 0;
        if (current == sink) return incoming_water;

        for (int &i = ptr[current]; i < adj[current].size(); i++) {
            auto &edge = adj[current][i];
            int remaining_capacity = edge.capacity - edge.flow;
            
            if (level[current] + 1 != level[edge.to] || remaining_capacity == 0) continue;
            
            int pushed = push_water(edge.to, sink, min(incoming_water, remaining_capacity));
            if (pushed == 0) continue;
            
            edge.flow += pushed;
            adj[edge.to][edge.rev_index].flow -= pushed;
            return pushed;
        }
        return 0;
    }

    int calculate_max_flow(int source, int sink) {
        int totalflow = 0;
        while (build_level_graph(source, sink)) {
            fill(ptr.begin(), ptr.end(), 0);
            while (int pushed = push_water(source, sink, 1e9)) {
                totalflow += pushed;
            }
        }
        return totalflow;
    }

    vector<pair<int, int>> find_bottlenecks(int source) {
        vector<bool> visited(num_nodes, false);
        queue<int> q;
        
        q.push(source);
        visited[source] = true;
        
        while (!q.empty()) {
            int curr = q.front();
            q.pop();
            
            for (auto &edge : adj[curr]) {
                if (!visited[edge.to] && (edge.capacity - edge.flow) > 0) {
                    visited[edge.to] = true;
                    q.push(edge.to);
                }
            }
        }
        
        vector<pair<int, int>> bottlenecks;
        for (int i = 0; i < num_nodes; i++) {
            if (visited[i]) {
                for (auto &edge : adj[i]) {
                    if (!visited[edge.to] && edge.capacity > 0) {
                        bottlenecks.push_back({i, edge.to});
                    }
                }
            }
        }
        
        return bottlenecks;
    }
};

int main() {
    fast_io();

    int n, m, source, sink;
    if (!(cin >> n >> m >> source >> sink)) {
        n = 4; m = 5; source = 0; sink = 3;
        Dinic dinic(n);
        dinic.add_edge(0, 1, 10);
        dinic.add_edge(0, 2, 5);
        dinic.add_edge(1, 2, 15);
        dinic.add_edge(1, 3, 5);
        dinic.add_edge(2, 3, 10);
        
        int max_flow = dinic.calculate_max_flow(source, sink);
        vector<pair<int, int>> bottlenecks = dinic.find_bottlenecks(source);
        
        cout << "MAX_FLOW: " << max_flow << "\n";
        cout << "BOTTLENECKS:\n";
        for (auto b : bottlenecks) {
            cout << b.first << " " << b.second << "\n";
        }
        return 0;
    }

    Dinic dinic(n);
    for (int i = 0; i < m; i++) {
        int u, v, cap;
        cin >> u >> v >> cap;
        dinic.add_edge(u, v, cap);
    }

    int max_flow = dinic.calculate_max_flow(source, sink);
    
    vector<pair<int, int>> bottlenecks = dinic.find_bottlenecks(source);

    cout << "MAX_FLOW: " << max_flow << "\n";
    cout << "BOTTLENECKS:\n";
    for (auto b : bottlenecks) {
        cout << b.first << " " << b.second << "\n";
    }

    return 0;
}