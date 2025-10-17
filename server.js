const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = app.listen(process.env.PORT || 8080, () =>
  console.log('✅ Server läuft auf Port 8080')
);
const wss = new WebSocket.Server({ server });

// === Datenbank ===
const db = new sqlite3.Database('chat.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      time TEXT NOT NULL
    )
  `);
});

// === WebSocket Chat ===
wss.on('connection', ws => {
  // Alte Nachrichten senden
  db.all('SELECT * FROM messages ORDER BY id ASC', [], (err, rows) => {
    if (!err) ws.send(JSON.stringify({ type: 'history', data: rows }));
  });

  ws.on('message', msgRaw => {
    const text = msgRaw.toString().trim();
    if (!text) return;

    const time = new Date().toLocaleString();
    db.run('INSERT INTO messages (text, time) VALUES (?, ?)', [text, time], function() {
      const message = { id: this.lastID, text, time };
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN)
          client.send(JSON.stringify({ type: 'new', data: message }));
      });
    });
  });
});

// === Nachrichten im Browser anzeigen ===
app.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send('Fehler beim Laden.');
    res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nachrichtenverlauf</title>
          <style>
            body { font-family: Segoe UI, sans-serif; padding: 20px; background: #f0f0f0; }
            h1 { color: #333; }
            .msg { background: white; padding: 10px; margin-bottom: 10px; border-radius: 8px; }
            .time { color: #777; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>Gespeicherte Nachrichten</h1>
          ${rows.map(r => `<div class="msg"><div>${r.text}</div><div class="time">${r.time}</div></div>`).join('')}
        </body>
      </html>
    `);
  });
});
