function openWindow(id) { document.getElementById(id).style.display = 'flex'; }
function closeWindow(id) { document.getElementById(id).style.display = 'none'; }
function minimizeWindow(id) { document.getElementById(id).style.display = 'none'; }
function maximizeWindow(id) {
  const win = document.getElementById(id);
  const btn = win.querySelector('.window-buttons button:nth-child(2)'); // Maximize button
  if (!win.classList.contains('maximized')) {
    // Store original size & position
    win.dataset.origWidth = win.style.width || win.offsetWidth + 'px';
    win.dataset.origHeight = win.style.height || win.offsetHeight + 'px';
    win.dataset.origTop = win.style.top || win.offsetTop + 'px';
    win.dataset.origLeft = win.style.left || win.offsetLeft + 'px';

    // Maximize
    win.style.width = window.innerWidth + 'px';
    win.style.height = (window.innerHeight - 40) + 'px'; // Taskbar
    win.style.top = '0px';
    win.style.left = '0px';
    win.classList.add('maximized');

    // Change icon
    btn.textContent = '❐';
  } else {
    // Restore original size
    win.style.width = win.dataset.origWidth;
    win.style.height = win.dataset.origHeight;
    win.style.top = win.dataset.origTop;
    win.style.left = win.dataset.origLeft;
    win.classList.remove('maximized');

    // Restore icon
    btn.textContent = '□';
  }
}


// Fenster drag & drop
let dragData = null;
function startDrag(e, el) {
  dragData = { el, startX: e.clientX, startY: e.clientY, origX: el.offsetLeft, origY: el.offsetTop };
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
}

function doDrag(e) {
  if (!dragData) return;
  dragData.el.style.left = dragData.origX + e.clientX - dragData.startX + 'px';
  dragData.el.style.top = dragData.origY + e.clientY - dragData.startY + 'px';
}

function stopDrag() {
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
  dragData = null;
}

// Startmenü toggle mit Animation
function toggleStartMenu() {
  const menu = document.getElementById('startMenu');
  if (menu.classList.contains('show')) {
    menu.classList.remove('show');
    setTimeout(() => { menu.style.display = 'none'; }, 200);
  } else {
    menu.style.display = 'flex';
    setTimeout(() => menu.classList.add('show'), 10);
  }
}

// Uhrzeit aktualisieren
function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  clock.textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000);
updateClock();

const openWindows = {};

function openWindow(id) {
  const win = document.getElementById(id);
  win.style.display = 'flex';
  win.style.zIndex = 10;

  if (!openWindows[id]) {
    const btn = document.createElement('button');

    // Icon des Desktop-Symbols
    const icon = document.querySelector(`.desktop .icon[onclick="openWindow('${id}')"] img`);
    const img = document.createElement('img');
    img.src = icon.src;
    btn.appendChild(img);

    // Fenstertitel
    const span = document.createElement('span');
    span.textContent = win.querySelector('.title-text').textContent;
    btn.appendChild(span);

    btn.onclick = () => toggleWindow(id);
    btn.id = 'task-' + id;
    document.getElementById('taskbarWindows').appendChild(btn);
    openWindows[id] = true;
  }
}

function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
  const btn = document.getElementById('task-' + id);
  if (btn) btn.remove();
  delete openWindows[id];
}

function minimizeWindow(id) {
  document.getElementById(id).style.display = 'none';
}

function toggleWindow(id) {
  const win = document.getElementById(id);
  if (win.style.display === 'flex') {
    win.style.display = 'none';
  } else {
    win.style.display = 'flex';
    win.style.zIndex = 10;
  }
}

const startMenu = document.getElementById('startMenu');
const menuItems = startMenu.querySelectorAll('.menu-item');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const text = item.textContent.toLowerCase();
    if (text.includes('über mich')) openWindow('about');
    else if (text.includes('projekte')) openWindow('projects');
    else if (text.includes('explorer')) openWindow('explorer');
    else if (text.includes('beenden')) alert('Portfolio schließen?'); // optional
    toggleStartMenu(); // Menü nach Klick schließen
  });
});

function openFile(fileId) {
  if (fileId === 'file1') {
    // Open PDF in new tab
    window.open('files/Lebenslauf.pdf', '_blank');
    return;
  }
  
  if(fileId === 'file2') {
    window.open('files/Anschreiben.pdf', '_blank');
    return;
  }

  // Other files use the detail view
  document.getElementById('explorerContent').style.display = 'none';
  const detail = document.getElementById('fileDetail');
  detail.style.display = 'flex';
  const content = document.getElementById('fileDetailContent');

  if(fileId === 'image1') content.innerHTML = '<img src="https://via.placeholder.com/200" alt="Bild.png">';
  else if(fileId === 'project1') content.innerHTML = '<p>Beschreibung des Unity-Projekts...</p>';
}

let ws;
const chat = document.getElementById('chatMessages');

function connectChat() {
  ws = new WebSocket("ws://localhost:8080"); // später wss://yourapp.railway.app

  ws.onopen = () => console.log("✅ Verbunden");
  ws.onerror = (err) => console.error("WebSocket-Fehler:", err);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === 'history') {
      chat.innerHTML = '';
      msg.data.forEach(m => addMessage(m.text, m.time));
    } else if (msg.type === 'new') {
      addMessage(msg.data.text, msg.data.time);
    }
  };
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || ws.readyState !== WebSocket.OPEN) return;
  ws.send(text);
  input.value = '';
}

function addMessage(text, time) {
  const div = document.createElement('div');
  div.textContent = `[${time}] ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

window.addEventListener('load', connectChat);

function openMessages() {
  window.open("http://localhost:8080/messages", "_blank");
}

(function enableWindowResizers(){
  const MIN_W = 200, MIN_H = 120;

  document.querySelectorAll('.window').forEach(win => {
    // Guard: nicht doppelt anlegen
    if (win._resizerAttached) return;
    win._resizerAttached = true;

    const add = (cls, kind) => {
      const d = document.createElement('div');
      d.className = `resizer ${cls} ${kind==='corner'?'corner':'side'}`;
      d.dataset.dir = cls;
      win.appendChild(d);
      return d;
    };

    // Ecken
    ['tl','tr','bl','br'].forEach(c => add(c,'corner'));
    // Seiten
    ['left','right','top','bottom'].forEach(s => add(s,'side'));

    let state = null;

    function onDown(e){
      // nur linke Taste
      if (e.button !== 0) return;
      const dir = e.currentTarget.dataset.dir;
      state = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: win.offsetWidth,
        startH: win.offsetHeight,
        startL: parseInt(win.style.left || win.offsetLeft),
        startT: parseInt(win.style.top || win.offsetTop)
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    }

    function onMove(e){
      if (!state) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      let newW = state.startW, newH = state.startH, newL = state.startL, newT = state.startT;

      // horizontal
      if (state.dir.includes('right')) {
        newW = Math.max(MIN_W, state.startW + dx);
      }
      if (state.dir.includes('left')) {
        newW = Math.max(MIN_W, state.startW - dx);
        newL = state.startL + (state.startW - newW);
      }

      // vertical
      if (state.dir.includes('bottom')) {
        newH = Math.max(MIN_H, state.startH + dy);
      }
      if (state.dir.includes('top')) {
        newH = Math.max(MIN_H, state.startH - dy);
        newT = state.startT + (state.startH - newH);
      }

      // Apply
      win.style.width = newW + 'px';
      win.style.height = newH + 'px';
      win.style.left = newL + 'px';
      win.style.top = newT + 'px';
    }

    function onUp(){
      state = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    // Event anhängen
    win.querySelectorAll('.resizer').forEach(r => r.addEventListener('mousedown', onDown));
  });
})();
