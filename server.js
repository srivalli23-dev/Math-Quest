// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'players.json');

app.use(express.json());
app.use((req,res,next)=>{
  // allow local dev cross-origin calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// create data file if missing
if(!fs.existsSync(DATA_FILE)){
  fs.writeFileSync(DATA_FILE, JSON.stringify([],'',2));
}

// small ping route
app.get('/ping', (req,res)=>res.json({ ok:true }));

// Start route (optional)
app.post('/start', (req,res) => {
  // could verify or initialize a session; for now just ack
  res.json({ ok:true });
});

// submit score
app.post('/submit-score', (req,res) => {
  try {
    const { name, age, score } = req.body;
    if(typeof name !== 'string') return res.status(400).json({ error:'invalid name' });
    const entry = { name: name.trim().slice(0,64) || 'Guest', age: Number(age) || 0, score: Number(score) || 0, ts: Date.now() };
    const data = JSON.parse(fs.readFileSync(DATA_FILE,'utf8') || '[]');
    data.push(entry);
    // keep file sorted by score desc
    data.sort((a,b)=>b.score - a.score || a.ts - b.ts);
    // limit stored entries to 200
    const toStore = data.slice(0,200);
    fs.writeFileSync(DATA_FILE, JSON.stringify(toStore, null, 2));
    res.json({ ok:true });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'save_failed' });
  }
});

// leaderboard
app.get('/leaderboard', (req,res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE,'utf8') || '[]');
    // return top 50
    res.json(data.slice(0,50));
  } catch(err){
    res.status(500).json({ error:'cannot_read' });
  }
});

// serve a little help page if you open backend in browser
app.get('/', (req,res) => res.send('Math game backend running. POST /submit-score, GET /leaderboard'));

app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));
