// --- Mostrar/ocultar secciones ---
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const tripSection = document.getElementById('trip-section');

// Simulación de estado de autenticación
let isAuthenticated = false;

function showSection(section) {
  registerSection.style.display = 'none';
  loginSection.style.display = 'none';
  tripSection.style.display = 'none';
  section.style.display = 'block';
}

// Inicialmente mostrar registro
showSection(registerSection);

// --- Cambio entre registro y login (ahora con backend) ---
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
    const res = await fetch('/api/server/register', {
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
    const res = await fetch('/api/server/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      isAuthenticated = true;
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
  {x: 60, y: 40},
  {x: 180, y: 40},
  {x: 240, y: 120},
  {x: 180, y: 200},
  {x: 60, y: 200},
  {x: 0, y: 120}
];
const edges = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3],[1,4],[2,5]
];

let selectedOrigin = null;
let selectedDestination = null;

function drawGraph(activePath=[]) {
  graphContainer.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 260);
  svg.setAttribute('height', 240);

  // Draw edges
  edges.forEach(([u,v]) => {
    const isActive = activePath.includes(u) && activePath.includes(v) && Math.abs(activePath.indexOf(u) - activePath.indexOf(v)) === 1;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', nodePositions[u].x);
    line.setAttribute('y1', nodePositions[u].y);
    line.setAttribute('x2', nodePositions[v].x);
    line.setAttribute('y2', nodePositions[v].y);
    line.setAttribute('class', 'edge' + (isActive ? ' active' : ''));
    svg.appendChild(line);
  });

  // Draw nodes
  nodePositions.forEach((pos, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', 20);
    circle.setAttribute('class', 'node' +
      (selectedOrigin === i ? ' origin' : selectedDestination === i ? ' destination' : ''));
    circle.addEventListener('click', () => handleNodeClick(i));
    svg.appendChild(circle);

    // Node number
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y + 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '18');
    text.setAttribute('fill', '#222');
    text.textContent = (i+1);
    svg.appendChild(text);
  });

  graphContainer.appendChild(svg);
}

drawGraph();

function handleNodeClick(i) {
  if (selectedOrigin === null) {
    selectedOrigin = i;
    document.getElementById('origin-select').value = i;
  } else if (selectedDestination === null && i !== selectedOrigin) {
    selectedDestination = i;
    document.getElementById('destination-select').value = i;
  } else if (i === selectedOrigin) {
    selectedOrigin = null;
    document.getElementById('origin-select').value = '';
  } else if (i === selectedDestination) {
    selectedDestination = null;
    document.getElementById('destination-select').value = '';
  }
  drawGraph();
  updateCalculateBtn();
}

// --- Selects para origen/destino ---
const originSelect = document.getElementById('origin-select');
const destinationSelect = document.getElementById('destination-select');

originSelect.addEventListener('change', function() {
  selectedOrigin = this.value === '' ? null : parseInt(this.value);
  if (selectedOrigin === selectedDestination) selectedDestination = null;
  destinationSelect.value = selectedDestination === null ? '' : selectedDestination;
  drawGraph();
  updateCalculateBtn();
});
destinationSelect.addEventListener('change', function() {
  selectedDestination = this.value === '' ? null : parseInt(this.value);
  if (selectedOrigin === selectedDestination) selectedOrigin = null;
  originSelect.value = selectedOrigin === null ? '' : selectedOrigin;
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

calculateBtn.addEventListener('click', async function() {
  if (selectedOrigin === null || selectedDestination === null) return;
  progressBarContainer.style.display = 'block';
  progressBar.style.width = '0%';
  resultDiv.textContent = '';

  // Llama al backend para calcular la ruta
  try {
    const res = await fetch('/api/server/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: selectedOrigin, destination: selectedDestination })
    });
    const data = await res.json();
    if (!res.ok) {
      resultDiv.textContent = data.error || 'Error al calcular la ruta';
      progressBarContainer.style.display = 'none';
      return;
    }
    // Animación de barra de progreso según el tiempo total
    const totalTime = data.totalTime;
    const path = data.path;
    const cost = data.cost;
    let progress = 0;
    let step = 0;
    drawGraph(path);
    function animateStep() {
      if (step >= path.length - 1) {
        progressBar.style.width = '100%';
        resultDiv.textContent = `Tiempo total: ${totalTime} segundos | Costo: $${cost}`;
        setTimeout(() => {
          progressBarContainer.style.display = 'none';
          progressBar.style.width = '0%';
          selectedOrigin = null;
          selectedDestination = null;
          originSelect.value = '';
          destinationSelect.value = '';
          drawGraph();
          updateCalculateBtn();
          resultDiv.textContent = '';
        }, 2500);
        return;
      }
      // Calcula el peso de la arista actual
      const u = path[step], v = path[step+1];
      let w = 1;
      for (const [a,b,ww] of [[0,1,4],[1,2,2],[2,3,7],[3,4,3],[4,5,5],[5,0,6],[0,3,8],[1,4,1],[2,5,9]]) {
        if ((a === u && b === v) || (a === v && b === u)) { w = ww; break; }
      }
      const percent = Math.round(((step+1)/(path.length-1))*100);
      progressBar.style.width = percent + '%';
      setTimeout(() => {
        step++;
        drawGraph(path.slice(0, step+1));
        animateStep();
      }, w * 200); // 200ms por segundo simulado
    }
    animateStep();
  } catch (err) {
    resultDiv.textContent = 'Error de conexión con el servidor';
    progressBarContainer.style.display = 'none';
  }
});

// --- Botón para ir a login desde registro ---
const goLoginBtn = document.getElementById('go-login-btn');
goLoginBtn.addEventListener('click', function() {
  showSection(loginSection);
});

// --- Botón para cerrar sesión desde la pantalla de viajes ---
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', function() {
  isAuthenticated = false;
  selectedOrigin = null;
  selectedDestination = null;
  document.getElementById('origin-select').value = '';
  document.getElementById('destination-select').value = '';
  drawGraph();
  updateCalculateBtn();
  showSection(registerSection);
}); 