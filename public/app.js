// --- Mostrar/ocultar secciones ---
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const tripSection = document.getElementById('trip-section');
const goLoginBtn = document.getElementById('go-login-btn');
const logoutBtn = document.getElementById('logout-btn');

function showSection(section) {
  registerSection.style.display = 'none';
  loginSection.style.display = 'none';
  tripSection.style.display = 'none';
  section.style.display = 'block';
}

goLoginBtn.addEventListener('click', () => showSection(loginSection));
logoutBtn.addEventListener('click', () => showSection(registerSection));

// Inicialmente mostrar registro
showSection(registerSection);

// --- Cambio entre registro y login (con backend) ---
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

// Mensajes de error/éxito
function showMessage(section, msg, isError = false) {
  let el = section.querySelector('.msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'msg';
    section.insertBefore(el, section.firstChild.nextSibling);
  }
  el.textContent = msg;
  el.style.color = isError ? '#d32f2f' : '#388e3c';
  el.style.marginBottom = '10px';
}

registerForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      showMessage(registerSection, 'Registro exitoso. Ahora inicia sesión.');
      setTimeout(() => showSection(loginSection), 1200);
    } else {
      showMessage(registerSection, data.error || 'Error en el registro', true);
    }
  } catch (err) {
    showMessage(registerSection, 'Error de conexión con el servidor', true);
  }
});

loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      showSection(tripSection);
      drawGraph();
    } else {
      showMessage(loginSection, data.error || 'Error en el login', true);
    }
  } catch (err) {
    showMessage(loginSection, 'Error de conexión con el servidor', true);
  }
});

// --- Grafo de 6 nodos ---
const graphContainer = document.getElementById('graph-container');
const NODES = 6;
const nodePositions = [
  null, // índice 0 no se usa
  {x: 150, y: 40},   // 1 (arriba)
  {x: 240, y: 90},   // 2 (arriba derecha)
  {x: 240, y: 190},  // 3 (abajo derecha)
  {x: 150, y: 135},  // 4 (centro)
  {x: 60,  y: 190},  // 5 (abajo izquierda)
  {x: 60,  y: 90}    // 6 (arriba izquierda)
];
const edges = [
  [1,4,4], [4,1,4],
  [2,4,2], [4,2,2],
  [3,4,7], [4,3,7],
  [5,4,3], [4,5,3],
  [6,4,5], [4,6,5],
  [1,2,6], [2,1,6],
  [2,3,8], [3,2,8],
  [3,5,9], [5,3,9],
  [5,6,5], [6,5,5],
  [6,1,6], [1,6,6]
];

let selectedOrigin = null;
let selectedDestination = null;

function drawGraph(activePath=[]) {
  graphContainer.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 300);
  svg.setAttribute('height', 240);

  // Draw edges and weights
  edges.forEach(([u, v, w]) => {
    const isActive = activePath.includes(u) && activePath.includes(v) && Math.abs(activePath.indexOf(u) - activePath.indexOf(v)) === 1;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', nodePositions[u].x);
    line.setAttribute('y1', nodePositions[u].y);
    line.setAttribute('x2', nodePositions[v].x);
    line.setAttribute('y2', nodePositions[v].y);
    line.setAttribute('class', 'edge' + (isActive ? ' active' : ''));
    svg.appendChild(line);

    // Draw weight
    const midX = (nodePositions[u].x + nodePositions[v].x) / 2;
    const midY = (nodePositions[u].y + nodePositions[v].y) / 2;
    const weightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    weightText.setAttribute('x', midX);
    weightText.setAttribute('y', midY - 8);
    weightText.setAttribute('text-anchor', 'middle');
    weightText.setAttribute('font-size', '13');
    weightText.setAttribute('fill', '#444');
    weightText.setAttribute('background', '#fff');
    weightText.textContent = w;
    svg.appendChild(weightText);
  });

  // Draw nodes
  for (let i = 1; i <= NODES; i++) {
    const pos = nodePositions[i];
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', 22);
    circle.setAttribute('class', 'node' +
      (selectedOrigin === i ? ' origin' : selectedDestination === i ? ' destination' : ''));
    circle.addEventListener('click', () => handleNodeClick(i));
    svg.appendChild(circle);

    // Node number
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y + 7);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '18');
    text.setAttribute('fill', '#fff');
    text.textContent = i;
    svg.appendChild(text);
  }

  graphContainer.appendChild(svg);
}

drawGraph();

function handleNodeClick(nodeIndex) {
  if (selectedOrigin === null) {
    selectedOrigin = nodeIndex;
    originSelect.value = nodeIndex;
  } else if (selectedDestination === null && nodeIndex !== selectedOrigin) {
    selectedDestination = nodeIndex;
    destinationSelect.value = nodeIndex;
    calculateRoute();
  }
}

function calculateRoute() {
  if (selectedOrigin === null || selectedDestination === null) return;
  const path = dijkstra(selectedOrigin, selectedDestination);
  if (path) {
    drawGraph(path);
    const totalDistance = calculateTotalDistance(path);
    const price = totalDistance;
    progressBar.style.width = '100%';
    progressBar.textContent = `Ruta encontrada: ${path.map(n => n).join(' → ')} (${totalDistance} km, $${price})`;
    resultDiv.textContent = `Ruta encontrada: ${path.map(n => n).join(' → ')} (${totalDistance} km, $${price})`;
  } else {
    progressBar.style.width = '100%';
    progressBar.textContent = 'No se encontró ruta';
    resultDiv.textContent = 'No se encontró ruta';
  }
}

// --- Selects para origen/destino ---
const originSelect = document.getElementById('origin-select');
const destinationSelect = document.getElementById('destination-select');

originSelect.addEventListener('change', function() {
  const val = this.value === '' ? null : parseInt(this.value);
  if (val !== null && val === selectedDestination) {
    // Si el usuario selecciona el mismo nodo, solo actualiza el origen
    selectedOrigin = val;
    selectedDestination = null;
    destinationSelect.value = '';
  } else {
    selectedOrigin = val;
  }
  drawGraph();
  updateCalculateBtn();
});
destinationSelect.addEventListener('change', function() {
  const val = this.value === '' ? null : parseInt(this.value);
  if (val !== null && val === selectedOrigin) {
    // Si el usuario selecciona el mismo nodo, solo actualiza el destino
    selectedDestination = val;
    selectedOrigin = null;
    originSelect.value = '';
  } else {
    selectedDestination = val;
  }
  drawGraph();
  updateCalculateBtn();
});

function updateCalculateBtn() {
  document.getElementById('calculate-btn').disabled = (selectedOrigin === null || selectedDestination === null);
}

// --- Barra de progreso y resultado (con backend) ---
const calculateBtn = document.getElementById('calculate-btn');
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const resultDiv = document.getElementById('result');

calculateBtn.addEventListener('click', function() {
  calculateRoute();
});

// --- Estructura de grafo con listas de adyacencia ---
class SimpleGraph {
  constructor(n) {
    this.n = n;
    this.adj = Array.from({length: n + 1}, () => []); // 1-indexed
  }
  addEdge(u, v, w) {
    this.adj[u].push([v, w]);
    this.adj[v].push([u, w]); // no dirigido
  }
  dijkstraSimple(source) {
    const n = this.n + 1;
    const dist = Array(n).fill(Infinity);
    const visited = Array(n).fill(false);
    dist[source] = 0;
    for (let i = 1; i <= this.n; i++) {
      let u = -1;
      for (let j = 1; j <= this.n; j++) {
        if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
      }
      if (u === -1 || dist[u] === Infinity) break;
      visited[u] = true;
      for (const [v, w] of this.adj[u]) {
        if (!visited[v] && dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
        }
      }
    }
    return dist;
  }
  // Para reconstruir el camino más corto
  shortestPath(source, target) {
    const n = this.n + 1;
    const dist = Array(n).fill(Infinity);
    const prev = Array(n).fill(null);
    const visited = Array(n).fill(false);
    dist[source] = 0;
    for (let i = 1; i <= this.n; i++) {
      let u = -1;
      for (let j = 1; j <= this.n; j++) {
        if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
      }
      if (u === -1 || dist[u] === Infinity) break;
      visited[u] = true;
      for (const [v, w] of this.adj[u]) {
        if (!visited[v] && dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          prev[v] = u;
        }
      }
    }
    // reconstruir camino
    const path = [];
    let curr = target;
    while (curr !== null) {
      path.push(curr);
      curr = prev[curr];
    }
    path.reverse();
    if (path[0] !== source || dist[target] === Infinity) return null;
    return path;
  }
}

// --- Crear el grafo y agregar las aristas ---
const graph = new SimpleGraph(NODES);
[
  [1,4,4],
  [2,4,2],
  [3,4,7],
  [5,4,3],
  [6,4,5],
  [1,2,6],
  [2,3,8],
  [3,5,9],
  [5,6,5],
  [6,1,6]
].forEach(([u,v,w]) => graph.addEdge(u,v,w));

// --- Usar el grafo para rutas y distancias ---
function dijkstra(start, end) {
  return graph.shortestPath(start, end);
}

function calculateTotalDistance(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i], v = path[i+1];
    for (const [to, w] of graph.adj[u]) {
      if (to === v) { total += w; break; }
    }
  }
  return total;
}