import React, { useState, useRef, useEffect } from 'react';
import { packagesAPI } from '../../api';
import './Terminal.css';

const WELCOME = [
  { type: 'system', text: '─────────────────────────────────────' },
  { type: 'system', text: ' ATGCode Terminal  v1.0.0' },
  { type: 'system', text: ' Type "help" for available commands' },
  { type: 'system', text: '─────────────────────────────────────' },
];

const HELP_TEXT = `Available commands:
  help           — Show this help
  ls             — List project files
  clear          — Clear terminal
  npm install <pkg>  — Install npm package via CDN
  npm list       — Show installed packages
  echo <text>    — Print text
  pwd            — Print working directory`;

export default function Terminal({ project, onInstallPackage, onLog }) {
  const [lines, setLines] = useState(WELCOME);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const outputRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const print = (text, type = 'output') => {
    setLines(prev => [...prev, { type, text }]);
  };

  const handleCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    print(`$ ${trimmed}`, 'input');
    setHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistIdx(-1);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    if (command === 'clear') {
      setLines([]);
      return;
    }

    if (command === 'help') {
      HELP_TEXT.split('\n').forEach(l => print(l));
      return;
    }

    if (command === 'ls') {
      const files = project?.files || [];
      if (files.length === 0) {
        print('(empty)');
      } else {
        files.filter(f => !f.parentId).forEach(f => {
          print(`${f.type === 'folder' ? '📁' : '📄'} ${f.name}`);
        });
      }
      return;
    }

    if (command === 'pwd') {
      print('/workspace/' + (project?.name || 'project'));
      return;
    }

    if (command === 'echo') {
      print(parts.slice(1).join(' '));
      return;
    }

    if (command === 'npm') {
      const sub = parts[1]?.toLowerCase();

      if (sub === 'install' || sub === 'i') {
        const pkgName = parts[2];
        if (!pkgName) {
          print('Usage: npm install <package-name>', 'error');
          return;
        }
        print(`$ Running "npm install ${pkgName}"...`, 'system');
        setLoading(true);
        try {
          const result = await onInstallPackage(pkgName);
          print(`✓ ${result.package.name}@${result.package.version} — installed via CDN`, 'success');
          print(`  Import: ${result.importStatement}`, 'output');
          print(`  CDN: ${result.cdnUrls.esm}`, 'muted');
        } catch (err) {
          const msg = err.response?.data?.error || err.message;
          print(`✗ ${msg}`, 'error');
        }
        setLoading(false);
        return;
      }

      if (sub === 'list' || sub === 'ls') {
        const pkgs = project?.packages || [];
        if (pkgs.length === 0) {
          print('No packages installed.');
        } else {
          print(`Installed packages (${pkgs.length}):`);
          pkgs.forEach(p => print(`  • ${p} → https://esm.sh/${p}`));
        }
        return;
      }

      print(`Unknown npm command: ${sub}. Try: npm install <pkg>`, 'error');
      return;
    }

    print(`Command not found: ${command}. Type "help" for available commands.`, 'error');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      const idx = histIdx + 1;
      if (idx < history.length) {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      const idx = histIdx - 1;
      if (idx >= 0) {
        setHistIdx(idx);
        setInput(history[idx]);
      } else {
        setHistIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-header">
        <span className="terminal-title">⬛ TERMINAL</span>
        <button className="icon-btn" onClick={() => setLines([])}>clear</button>
      </div>
      <div className="terminal-output" ref={outputRef}>
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        {loading && <div className="terminal-line system">⏳ Loading...</div>}
      </div>
      <div className="terminal-input-row">
        <span className="prompt">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type a command (ls, clear, npm install axios, help...)"
          className="terminal-input"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
