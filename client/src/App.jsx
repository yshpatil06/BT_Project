import React, { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from './api';
import { useProject } from './hooks/useProject';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import LivePreview from './components/LivePreview';
import Terminal from './components/Terminal';
import PackageManager from './components/PackageManager';
import './App.css';

// ─── Project Selector Screen ────────────────────────────────────────────────
function ProjectSelector({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [template, setTemplate] = useState('vanilla');
  const [error, setError] = useState('');

  useEffect(() => {
    projectsAPI.getAll()
      .then(r => setProjects(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    try {
      const r = await projectsAPI.create({ name: newName.trim(), template });
      onSelect(r.data._id);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create project');
    }
  };

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    await projectsAPI.delete(id);
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  return (
    <div className="project-selector">
      <div className="ps-header">
        <div className="ps-logo">
          <span className="logo-icon">C</span>
          <div>
            <div className="logo-title">ATGCode</div>
            <div className="logo-sub">Browser IDE Sandbox</div>
          </div>
        </div>
      </div>

      <div className="ps-content">
        <div className="ps-new">
          <h2>Create New Project</h2>
          <div className="ps-form">
            <input
              placeholder="Project name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              className="ps-input"
            />
            <select value={template} onChange={e => setTemplate(e.target.value)} className="ps-select">
              <option value="vanilla">🌐 Vanilla HTML/CSS/JS</option>
              <option value="react">⚛️ React (CDN)</option>
              <option value="blank">📄 Blank</option>
            </select>
            <button onClick={create} className="ps-create-btn">+ Create Project</button>
          </div>
          {error && <div className="ps-error">{error}</div>}
        </div>

        <div className="ps-projects">
          <h2>Recent Projects</h2>
          {loading ? (
            <div className="ps-loading">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="ps-empty">No projects yet. Create one above!</div>
          ) : (
            <div className="ps-grid">
              {projects.map(p => (
                <div key={p._id} className="ps-card" onClick={() => onSelect(p._id)}>
                  <div className="ps-card-icon">
                    {p.template === 'react' ? '⚛️' : p.template === 'vue' ? '💚' : '🌐'}
                  </div>
                  <div className="ps-card-info">
                    <div className="ps-card-name">{p.name}</div>
                    <div className="ps-card-meta">
                      <span className="badge">{p.template}</span>
                      <span className="ps-card-date">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button className="ps-card-delete" onClick={e => deleteProject(e, p._id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IDE Layout ─────────────────────────────────────────────────────────────
function IDE({ projectId, onBack }) {
  const {
    project, loading, saving, error,
    updateFileContent, addFile, deleteFile, renameFile,
    setActiveFile, installPackage, removePackage, activeFile,
  } = useProject(projectId);

  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [editingProjectName, setEditingProjectName] = useState(false);

  useEffect(() => {
    if (project) setProjectNameInput(project.name);
  }, [project?.name]);

  const handleContentChange = useCallback((fileId, content) => {
    if (content !== null) updateFileContent(fileId, content);
    else setActiveFile(fileId);
  }, [updateFileContent, setActiveFile]);

  const handleRenameProject = async () => {
    if (!projectNameInput.trim()) return;
    try {
      await projectsAPI.update(projectId, { name: projectNameInput });
    } catch { /* ignore */ }
    setEditingProjectName(false);
  };

  if (loading) return (
    <div className="ide-loading">
      <div className="loading-spinner" />
      <p>Loading project...</p>
    </div>
  );

  if (error) return (
    <div className="ide-error">
      <p>⚠️ {error}</p>
      <button onClick={onBack}>← Back to projects</button>
    </div>
  );

  return (
    <div className="ide">
      {/* Top Header */}
      <header className="ide-header">
        <div className="header-left">
          <button className="header-logo" onClick={onBack}>
            <span className="logo-icon sm">C</span>
            <span>ATGCode</span>
          </button>
        </div>

        <div className="header-center">
          {editingProjectName ? (
            <form onSubmit={e => { e.preventDefault(); handleRenameProject(); }}>
              <input
                autoFocus
                value={projectNameInput}
                onChange={e => setProjectNameInput(e.target.value)}
                onBlur={handleRenameProject}
                className="project-name-input"
              />
            </form>
          ) : (
            <span className="project-name" onDoubleClick={() => setEditingProjectName(true)}>
              {project?.name}
            </span>
          )}
          {saving && <span className="saving-indicator">● saving...</span>}
        </div>

        <div className="header-right">
          <button
            className={`header-btn ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            🔍 Preview
          </button>
          <button
            className={`header-btn ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            ⌨️ Terminal
          </button>
          <button className="header-btn run-btn" onClick={() => setShowPreview(true)}>
            ▶ Run Code
          </button>
        </div>
      </header>

      {/* Main IDE Body */}
      <div className="ide-body">
        {/* Left Sidebar */}
        <div className="ide-sidebar">
          <FileExplorer
            project={project}
            onSelectFile={(fileId) => { setActiveFile(fileId); }}
            onAddFile={addFile}
            onDeleteFile={deleteFile}
            onRenameFile={renameFile}
          />
          <PackageManager
            packages={project?.packages || []}
            onInstall={installPackage}
            onRemove={removePackage}
          />
        </div>

        {/* Center: Editor + Terminal */}
        <div className="ide-main">
          <div className="ide-editor-area">
            <Editor
              project={project}
              activeFile={activeFile}
              onContentChange={handleContentChange}
            />
          </div>

          {showTerminal && (
            <div className="ide-terminal-area">
              <Terminal
                project={project}
                onInstallPackage={installPackage}
              />
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        {showPreview && (
          <div className="ide-preview-area">
            <LivePreview project={project} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────
export default function App() {
  const [projectId, setProjectId] = useState(() => {
    return localStorage.getItem('atgcode_last_project') || null;
  });

  const openProject = (id) => {
    localStorage.setItem('atgcode_last_project', id);
    setProjectId(id);
  };

  const goBack = () => {
    localStorage.removeItem('atgcode_last_project');
    setProjectId(null);
  };

  return projectId
    ? <IDE projectId={projectId} onBack={goBack} />
    : <ProjectSelector onSelect={openProject} />;
}
