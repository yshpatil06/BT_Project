require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const projectRoutes = require('./routes/projects');
const packageRoutes = require('./routes/packages');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', (ws, req) => {
  const projectId = new URL(req.url, 'http://localhost').searchParams.get('projectId');
  if (projectId) {
    if (!clients.has(projectId)) clients.set(projectId, new Set());
    clients.get(projectId).add(ws);
    console.log(`WS client connected for project: ${projectId}`);
  }
  ws.on('close', () => {
    if (projectId && clients.has(projectId)) {
      clients.get(projectId).delete(ws);
    }
  });
});

app.locals.broadcast = (projectId, data) => {
  if (clients.has(projectId)) {
    const msg = JSON.stringify(data);
    clients.get(projectId).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }
};

// ✅ CORS fix
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      process.env.CLIENT_URL + '/',
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    if (!origin || allowed.some(o => origin.startsWith(o.replace(/\/$/, '')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/projects', projectRoutes);
app.use('/api/packages', packageRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve React client build
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atgcode';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (no DB)`));
  });

module.exports = { app, wss };