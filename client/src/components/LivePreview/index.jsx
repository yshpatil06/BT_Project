import React, { useEffect, useRef, useState, useCallback } from 'react';
import './LivePreview.css';

function buildPreviewHTML(files = [], packages = []) {
  const htmlFile = files.find(f => f.name === 'index.html' && f.type === 'file');

  // Check if project has JSX files
  const jsxFiles = files.filter(f => f.name.endsWith('.jsx') && f.type === 'file');
  const hasJSX = jsxFiles.length > 0;

  // Check if project has any JS/JSX files (React project detection)
  const allJsFiles = files.filter(f => (f.name.endsWith('.js') || f.name.endsWith('.jsx')) && f.type === 'file');
  const cssFiles = files.filter(f => f.name.endsWith('.css') && f.type === 'file');

  // If no index.html but has JSX — auto-generate a React shell
  if (!htmlFile && hasJSX) {
    const mainJsx = jsxFiles.find(f => f.name === 'App.jsx' || f.name === 'main.jsx' || f.name === 'index.jsx') || jsxFiles[0];
    const cssContent = cssFiles.map(f => f.content).join('\n');

    const allJsxContent = jsxFiles.map(f => f.content).join('\n\n');

    return buildReactShell(allJsxContent, cssContent, packages);
  }

  if (!htmlFile) {
    return `<!DOCTYPE html><html><body style="font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh;background:#1e1e2e;color:#94a3b8">
      <div style="text-align:center"><div style="font-size:40px;margin-bottom:12px">🌐</div><p>No index.html found</p><small>Create an index.html to see a preview</small></div>
    </body></html>`;
  }

  let html = htmlFile.content;

  // Inject CSS files
  cssFiles.forEach(f => {
    html = html.replace(
      new RegExp(`<link[^>]*href=["']${f.name}["'][^>]*>`, 'gi'),
      `<style>\n${f.content}\n</style>`
    );
  });

  // Detect if HTML references JSX files — if so, use Babel mode
  const referencesJSX = jsxFiles.some(f =>
    new RegExp(`src=["']${f.name}["']`, 'i').test(html)
  );

  if (hasJSX || referencesJSX) {
    // Inject React + ReactDOM + Babel CDN if not already present
    if (!html.includes('react') && !html.includes('React')) {
      const reactCDN = `
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;
      html = html.replace('</head>', `${reactCDN}\n</head>`);
    }

    // Replace JSX script src references with inline Babel-transpiled scripts
    jsxFiles.forEach(f => {
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${f.name}["'][^>]*></script>`, 'gi'),
        `<script type="text/babel" data-presets="react">\n${f.content}\n</script>`
      );
    });

    // Inline plain JS files normally
    const plainJsFiles = allJsFiles.filter(f => f.name.endsWith('.js'));
    plainJsFiles.forEach(f => {
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${f.name}["'][^>]*></script>`, 'gi'),
        `<script>\n${f.content}\n</script>`
      );
    });
  } else {
    // Plain JS project — inject normally
    allJsFiles.forEach(f => {
      html = html.replace(
        new RegExp(`<script[^>]*src=["']${f.name}["'][^>]*></script>`, 'gi'),
        `<script>\n${f.content}\n</script>`
      );
    });
  }

  // Inject packages via esm.sh importmap
  if (packages.length > 0) {
    const importMap = packages.map(pkg => `"${pkg}": "https://esm.sh/${pkg}"`).join(',\n      ');
    const importMapScript = `<script type="importmap">{\n  "imports": {\n    ${importMap}\n  }\n}</script>`;
    html = html.replace('</head>', `${importMapScript}\n</head>`);
  }

  html = injectConsoleCapture(html);
  return html;
}

// Auto-generate a React shell when only JSX files exist (no index.html)
function buildReactShell(jsxContent, cssContent, packages) {
  const pkgImports = packages.length > 0
    ? packages.map(pkg => `"${pkg}": "https://esm.sh/${pkg}"`).join(',\n      ')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${pkgImports ? `<script type="importmap">{\n  "imports": {\n    ${pkgImports}\n  }\n}</script>` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext } = React;

    ${jsxContent}

    // Auto-mount: try App, then first exported component
    try {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
    } catch(e) {
      console.error('Could not mount App:', e.message);
    }
  </script>
</body>
</html>`;
}

function injectConsoleCapture(html) {
  const consoleScript = `<script>
  (function() {
    const _log = console.log.bind(console);
    const _err = console.error.bind(console);
    const _warn = console.warn.bind(console);
    const send = (type, args) => {
      try {
        window.parent.postMessage({
          type: 'console', level: type,
          message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
    };
    console.log = (...args) => { _log(...args); send('log', args); };
    console.error = (...args) => { _err(...args); send('error', args); };
    console.warn = (...args) => { _warn(...args); send('warn', args); };
    window.onerror = (msg, src, line) => {
      send('error', ['[ERROR] ' + msg + ' (line ' + line + ')']);
      return false;
    };
  })();
  </script>`;
  return html.replace('<head>', `<head>\n${consoleScript}`);
}

export default function LivePreview({ project }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!iframeRef.current || !project) return;
    const html = buildPreviewHTML(project.files, project.packages);
    iframeRef.current.srcdoc = html;
  }, [project, refreshKey]);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev.slice(-49), {
          level: e.data.level,
          message: e.data.message,
          time: new Date().toLocaleTimeString(),
        }]);
        if (e.data.level === 'error') setShowConsole(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const clearConsole = () => setConsoleLogs([]);
  const errorCount = consoleLogs.filter(l => l.level === 'error').length;

  return (
    <div className="live-preview">
      <div className="preview-header">
        <div className="preview-title">
          <span className="live-dot" />
          LIVE PREVIEW
        </div>
        <div className="preview-controls">
          <button className="icon-btn" onClick={clearConsole} title="Clear console">🗑️</button>
          <button
            className={`icon-btn ${showConsole ? 'active' : ''}`}
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle console"
          >
            ⌨️ {errorCount > 0 && <span className="error-badge">{errorCount}</span>}
          </button>
          <button className="icon-btn" onClick={refresh} title="Refresh">↺</button>
        </div>
      </div>

      <div className="preview-browser-bar">
        <div className="browser-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="browser-url">preview://index.html</div>
      </div>

      <div className="preview-content" style={{ flex: showConsole ? '1 1 60%' : '1' }}>
        {isLoading && <div className="preview-loading">Loading...</div>}
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {showConsole && (
        <div className="preview-console">
          <div className="console-header">
            <span>Console</span>
            <button className="icon-btn" onClick={() => setShowConsole(false)}>×</button>
          </div>
          <div className="console-output">
            {consoleLogs.length === 0 ? (
              <div className="console-empty">No output yet</div>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className={`console-line ${log.level}`}>
                  <span className="console-time">{log.time}</span>
                  <span className="console-msg">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
