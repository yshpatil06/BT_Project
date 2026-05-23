const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');

// In-memory fallback store
const memStore = new Map();

const isMongoConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

const getLanguage = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript',
    tsx: 'typescript', html: 'html', css: 'css', scss: 'css',
    json: 'json', md: 'markdown', py: 'python', txt: 'plaintext',
  };
  return map[ext] || 'plaintext';
};

const defaultTemplates = {
  vanilla: [
    {
      id: uuidv4(), name: 'index.html', type: 'file', parentId: null,
      path: '/index.html', language: 'html',
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Hello, World!</h1>\n    <p>Start editing to see live changes.</p>\n    <button id="btn">Click Me</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`,
    },
    {
      id: uuidv4(), name: 'style.css', type: 'file', parentId: null,
      path: '/style.css', language: 'css',
      content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody {\n  font-family: Arial, sans-serif;\n  background: #1e1e2e;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n.container {\n  background: white;\n  padding: 40px;\n  border-radius: 12px;\n  text-align: center;\n  box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}\nh1 { color: #333; margin-bottom: 10px; }\np { color: #666; margin-bottom: 20px; }\nbutton {\n  background: #6366f1;\n  color: white;\n  border: none;\n  padding: 10px 24px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 16px;\n}\nbutton:hover { background: #4f46e5; }`,
    },
    {
      id: uuidv4(), name: 'script.js', type: 'file', parentId: null,
      path: '/script.js', language: 'javascript',
      content: `const btn = document.getElementById('btn');\nlet count = 0;\n\nbtn.addEventListener('click', () => {\n  count++;\n  btn.textContent = \`Clicked \${count} times\`;\n  console.log('Button clicked:', count);\n});`,
    },
  ],
  react: [
    {
      id: uuidv4(), name: 'index.html', type: 'file', parentId: null,
      path: '/index.html', language: 'html',
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>React App</title>\n  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>\n  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>\n  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div id="root"></div>\n  <script type="text/babel" src="App.jsx"></script>\n</body>\n</html>`,
    },
    {
      id: uuidv4(), name: 'App.jsx', type: 'file', parentId: null,
      path: '/App.jsx', language: 'javascript',
      content: `const { useState } = React;\n\nfunction App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="container">\n      <h1>React Counter</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n      <button onClick={() => setCount(0)} style={{marginLeft:8,background:'#ef4444'}}>Reset</button>\n    </div>\n  );\n}\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    },
    {
      id: uuidv4(), name: 'style.css', type: 'file', parentId: null,
      path: '/style.css', language: 'css',
      content: `body { margin:0; font-family: Arial; background: #0f172a; display:flex; justify-content:center; align-items:center; min-height:100vh; }\n.container { background:white; padding:40px; border-radius:12px; text-align:center; }\nh1 { margin-bottom:16px; }\nbutton { background:#6366f1; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-size:15px; }\nbutton:hover { opacity:0.9; }`,
    },
  ],
  blank: [
    {
      id: uuidv4(), name: 'index.html', type: 'file', parentId: null,
      path: '/index.html', language: 'html',
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Blank Project</title>\n</head>\n<body>\n  <h1>Blank Project</h1>\n</body>\n</html>`,
    },
  ],
};

// GET all projects
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find({}, 'name description template createdAt updatedAt').sort('-updatedAt');
      return res.json(projects);
    }
    const list = Array.from(memStore.values()).map(p => ({
      _id: p._id, name: p.name, description: p.description,
      template: p.template, createdAt: p.createdAt, updatedAt: p.updatedAt,
    }));
    res.json(list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      return res.json(project);
    }
    const project = memStore.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', async (req, res) => {
  try {
    const { name, description = '', template = 'vanilla', owner = 'anonymous' } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name required' });
    const files = (defaultTemplates[template] || defaultTemplates.vanilla).map(f => ({ ...f, id: uuidv4() }));
    const activeFileId = files[0]?.id || null;

    if (isMongoConnected()) {
      const project = await Project.create({ name, description, template, owner, files, activeFileId });
      return res.status(201).json(project);
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const project = { _id: id, name, description, template, owner, files, activeFileId, packages: [], createdAt: now, updatedAt: now };
    memStore.set(id, project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project (files, name, packages, activeFileId)
router.put('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      req.app.locals.broadcast(req.params.id, { type: 'PROJECT_UPDATED', project });
      return res.json(project);
    }
    const project = memStore.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const updated = { ...project, ...req.body, updatedAt: new Date().toISOString() };
    memStore.set(req.params.id, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update single file content
router.patch('/:id/files/:fileId', async (req, res) => {
  try {
    const { content } = req.body;
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      const file = project.files.id(req.params.fileId) || project.files.find(f => f.id === req.params.fileId);
      if (!file) return res.status(404).json({ error: 'File not found' });
      file.content = content;
      await project.save();
      req.app.locals.broadcast(req.params.id, { type: 'FILE_UPDATED', fileId: req.params.fileId, content });
      return res.json(project);
    }
    const project = memStore.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.files = project.files.map(f => f.id === req.params.fileId ? { ...f, content } : f);
    project.updatedAt = new Date().toISOString();
    memStore.set(req.params.id, project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add file/folder
router.post('/:id/files', async (req, res) => {
  try {
    const { name, type = 'file', parentId = null, content = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'File name required' });
    const newFile = {
      id: uuidv4(), name, type, parentId,
      path: parentId ? `/${name}` : `/${name}`,
      language: getLanguage(name), content,
    };
    if (isMongoConnected()) {
      const project = await Project.findByIdAndUpdate(
        req.params.id, { $push: { files: newFile } }, { new: true }
      );
      if (!project) return res.status(404).json({ error: 'Project not found' });
      return res.json(project);
    }
    const project = memStore.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.files.push(newFile);
    project.updatedAt = new Date().toISOString();
    memStore.set(req.params.id, project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE file
router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { $pull: { files: { id: req.params.fileId } } },
        { new: true }
      );
      if (!project) return res.status(404).json({ error: 'Project not found' });
      return res.json(project);
    }
    const project = memStore.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.files = project.files.filter(f => f.id !== req.params.fileId);
    project.updatedAt = new Date().toISOString();
    memStore.set(req.params.id, project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    if (isMongoConnected()) {
      await Project.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Project deleted' });
    }
    memStore.delete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
