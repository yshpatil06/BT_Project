import React, { useState, useRef } from 'react';
import './FileExplorer.css';

const FILE_ICONS = {
  html: '🌐', css: '🎨', js: '⚡', jsx: '⚛️',
  ts: '💙', tsx: '💙', json: '📋', md: '📝',
  txt: '📄', py: '🐍', folder: '📁', folderOpen: '📂',
};

const getIcon = (name, type, isOpen) => {
  if (type === 'folder') return isOpen ? FILE_ICONS.folderOpen : FILE_ICONS.folder;
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
};

function FileItem({ file, files, activeFileId, depth = 0, onSelect, onDelete, onRename, onNewFile, onNewFolder }) {
  const [isOpen, setIsOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef();

  const children = files.filter(f => f.parentId === file.id);
  const isActive = file.id === activeFileId;

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== file.name) onRename(file.id, newName.trim());
    setRenaming(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowMenu(true);
  };

  return (
    <div className="file-item-wrapper">
      <div
        className={`file-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => file.type === 'folder' ? setIsOpen(!isOpen) : onSelect(file.id)}
        onContextMenu={handleContextMenu}
      >
        <span className="file-icon">{getIcon(file.name, file.type, isOpen)}</span>
        {renaming ? (
          <form onSubmit={handleRenameSubmit} onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef} autoFocus value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRenameSubmit}
              className="rename-input"
            />
          </form>
        ) : (
          <span className="file-name">{file.name}</span>
        )}
        <div className="file-actions" onClick={e => e.stopPropagation()}>
          {file.type === 'folder' && (
            <>
              <button title="New File" onClick={() => onNewFile(file.id)}>+</button>
            </>
          )}
          <button title="Delete" onClick={() => onDelete(file.id)} className="delete-btn">×</button>
        </div>
      </div>
      {showMenu && (
        <ContextMenu
          file={file}
          onClose={() => setShowMenu(false)}
          onRename={() => { setRenaming(true); setShowMenu(false); setTimeout(() => inputRef.current?.focus(), 50); }}
          onDelete={() => { onDelete(file.id); setShowMenu(false); }}
          onNewFile={() => { onNewFile(file.id); setShowMenu(false); }}
        />
      )}
      {file.type === 'folder' && isOpen && children.map(child => (
        <FileItem
          key={child.id} file={child} files={files}
          activeFileId={activeFileId} depth={depth + 1}
          onSelect={onSelect} onDelete={onDelete}
          onRename={onRename} onNewFile={onNewFile}
          onNewFolder={onNewFolder}
        />
      ))}
    </div>
  );
}

function ContextMenu({ file, onClose, onRename, onDelete, onNewFile }) {
  return (
    <>
      <div className="context-overlay" onClick={onClose} />
      <div className="context-menu">
        <button onClick={onRename}>✏️ Rename</button>
        {file.type === 'folder' && <button onClick={onNewFile}>📄 New File</button>}
        <hr />
        <button onClick={onDelete} className="danger">🗑️ Delete</button>
      </div>
    </>
  );
}

function NewFileForm({ parentId, type, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim(), type, parentId);
  };
  return (
    <div className="new-file-form" style={{ paddingLeft: parentId ? '26px' : '12px' }}>
      <span>{type === 'folder' ? '📁' : '📄'}</span>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          onBlur={onCancel} placeholder={type === 'folder' ? 'folder name' : 'file.js'}
          className="rename-input"
        />
      </form>
    </div>
  );
}

export default function FileExplorer({ project, onSelectFile, onAddFile, onDeleteFile, onRenameFile }) {
  const [creating, setCreating] = useState(null); // { type, parentId }
  const [projectName, setProjectName] = useState(project?.name || '');
  const [editingName, setEditingName] = useState(false);

  const rootFiles = project?.files?.filter(f => !f.parentId) || [];

  const handleNew = (type, parentId = null) => setCreating({ type, parentId });
  const handleCreate = async (name, type, parentId) => {
    await onAddFile(name, type, parentId);
    setCreating(null);
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button title="New File" onClick={() => handleNew('file')} className="icon-btn">📄</button>
          <button title="New Folder" onClick={() => handleNew('folder')} className="icon-btn">📁</button>
        </div>
      </div>

      <div className="project-root">
        <span className="root-icon">▾</span>
        {editingName ? (
          <form onSubmit={e => { e.preventDefault(); setEditingName(false); }} style={{flex:1}}>
            <input className="rename-input" autoFocus value={projectName}
              onChange={e => setProjectName(e.target.value)} onBlur={() => setEditingName(false)} />
          </form>
        ) : (
          <span className="root-name" onDoubleClick={() => setEditingName(true)}>
            {project?.name || 'project'}
          </span>
        )}
      </div>

      <div className="file-tree">
        {creating && !creating.parentId && (
          <NewFileForm type={creating.type} parentId={null}
            onSubmit={handleCreate} onCancel={() => setCreating(null)} />
        )}
        {rootFiles.map(file => (
          <FileItem
            key={file.id} file={file} files={project.files}
            activeFileId={project.activeFileId}
            onSelect={onSelectFile}
            onDelete={onDeleteFile}
            onRename={onRenameFile}
            onNewFile={(parentId) => handleNew('file', parentId)}
            onNewFolder={(parentId) => handleNew('folder', parentId)}
          />
        ))}
      </div>
    </div>
  );
}
