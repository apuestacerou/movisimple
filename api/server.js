const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- Persistencia en memoria para usuarios (solo para demo en Vercel) ---
const users = [];

// --- Registro de usuario ---
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  if (users.some(user => user.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users.push({ name, email, password });
  res.json({ success: true });
});

// --- Login de usuario ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const user = users.find(user => user.email === email && user.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true });
});

// --- Grafo y Dijkstra ---
class GraphSimple {
  constructor(edges) {
    this.n = 6;
    this.adj = Array.from({ length: this.n }, () => []);
    edges.forEach(([u, v, w]) => {
      this.adj[u].push({ to: v, w });
      this.adj[v].push({ to: u, w });
    });
  }

  dijkstraSimple(source) {
    const dist = Array(this.n).fill(Infinity);
    const prev = Array(this.n).fill(null);
    const visited = Array(this.n).fill(false);
    dist[source] = 0;

    for (let i = 0; i < this.n; i++) {
      let u = -1;
      for (let j = 0; j < this.n; j++) {
        if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
      }
      if (dist[u] === Infinity) break;
      visited[u] = true;
      for (const { to, w } of this.adj[u]) {
        if (dist[u] + w < dist[to]) {
          dist[to] = dist[u] + w;
          prev[to] = u;
        }
      }
    }
    return { dist, prev };
  }

  getPath(prev, dest) {
    const path = [];
    for (let at = dest; at !== null; at = prev[at]) path.push(at);
    return path.reverse();
  }
}

const EDGES = [
  [0,1,4],[1,2,2],[2,3,7],[3,4,3],[4,5,5],[5,0,6],[0,3,8],[1,4,1],[2,5,9]
];
const graph = new GraphSimple(EDGES);

const TARIFF = 1; // $1 por segundo

app.post('/api/route', (req, res) => {
  const { origin, destination } = req.body;
  if (origin == null || destination == null) return res.status(400).json({ error: 'Missing nodes' });

  const { dist, prev } = graph.dijkstraSimple(origin);
  const path = graph.getPath(prev, destination);
  const totalTime = dist[destination];
  const cost = totalTime * TARIFF;

  res.json({
    path,
    totalTime,
    cost: cost.toFixed(2)
  });
});

module.exports = app;