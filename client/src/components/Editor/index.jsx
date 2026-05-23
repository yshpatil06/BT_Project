import React, { useState, useCallback, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './Editor.css';

const LANG_MAP = {
  html: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
  py: 'python', txt: 'plaintext',
};

function getMonacoLang(filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
}

const EDITOR_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'type', foreground: '8be9fd' },
    { token: 'function', foreground: '50fa7b' },
    { token: 'variable', foreground: 'f8f8f2' },
  ],
  colors: {
    'editor.background': '#1e1e2e',
    'editor.foreground': '#f8f8f2',
    'editorLineNumber.foreground': '#4b5563',
    'editorLineNumber.activeForeground': '#6366f1',
    'editor.lineHighlightBackground': '#2a2a3e',
    'editorCursor.foreground': '#6366f1',
    'editor.selectionBackground': '#3b3b5c',
    'editorIndentGuide.background': '#2d2d44',
    'editorIndentGuide.activeBackground': '#4d4d6a',
    'scrollbarSlider.background': '#2d2d44',
    'scrollbarSlider.hoverBackground': '#4d4d6a',
    'tab.activeBackground': '#1e1e2e',
    'tab.inactiveBackground': '#16213e',
    'editorWidget.background': '#1a1a2e',
    'input.background': '#16213e',
  },
};

export default function Editor({ project, activeFile, onContentChange }) {
  const [openTabs, setOpenTabs] = useState(() => {
    if (activeFile) return [activeFile.id];
    return project?.files?.[0] ? [project.files[0].id] : [];
  });
  const [activeTab, setActiveTab] = useState(activeFile?.id || project?.files?.[0]?.id);
  const editorRef = useRef(null);

  const currentFile = project?.files?.find(f => f.id === activeTab);

  const openTab = (fileId) => {
    if (!openTabs.includes(fileId)) setOpenTabs(prev => [...prev, fileId]);
    setActiveTab(fileId);
    onContentChange && onContentChange(fileId, null); // signal tab switch
  };

  const closeTab = (e, fileId) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(id => id !== fileId);
    setOpenTabs(newTabs);
    if (activeTab === fileId) setActiveTab(newTabs[newTabs.length - 1] || null);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('atgcode-dark', EDITOR_THEME);
    monaco.editor.setTheme('atgcode-dark');

    // Format on save (Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
  };

  const handleChange = useCallback((value) => {
    if (currentFile && value !== undefined) {
      onContentChange(currentFile.id, value);
    }
  }, [currentFile, onContentChange]);

  // Sync open tabs when project changes
  React.useEffect(() => {
    if (activeFile && !openTabs.includes(activeFile.id)) {
      setOpenTabs(prev => [...prev, activeFile.id]);
      setActiveTab(activeFile.id);
    }
  }, [activeFile]);

  const tabFiles = openTabs.map(id => project?.files?.find(f => f.id === id)).filter(Boolean);

  return (
    <div className="editor-container">
      <div className="editor-tabs">
        {tabFiles.map(file => (
          <div
            key={file.id}
            className={`editor-tab ${activeTab === file.id ? 'active' : ''}`}
            onClick={() => openTab(file.id)}
          >
            <span className="tab-name">{file.name}</span>
            <button className="tab-close" onClick={e => closeTab(e, file.id)}>×</button>
          </div>
        ))}
        {tabFiles.length === 0 && (
          <div className="no-tab-hint">Select a file to edit</div>
        )}
      </div>

      {currentFile ? (
        <div className="editor-body">
          <MonacoEditor
            height="100%"
            language={getMonacoLang(currentFile.name)}
            value={currentFile.content}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme="atgcode-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              suggestOnTriggerCharacters: true,
              quickSuggestions: { strings: true, comments: true },
              contextmenu: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      ) : (
        <div className="editor-empty">
          <div className="empty-icon">⚡</div>
          <p>Select a file from the Explorer</p>
          <span>or create a new file to start coding</span>
        </div>
      )}
    </div>
  );
}
