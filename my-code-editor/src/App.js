import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import ProjectExplorer from './components/ProjectExplorer/ProjectExplorer';
import Terminal from './components/Terminal/Terminal';
import CodeEditor from './components/CodeEditor';
import './App.css';

function App() {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html><html><head><title>Live Preview</title></head><body><h1>Hello, world!</h1></body></html>`);
  const [cssCode, setCssCode] = useState(`body { background-color: #f0f0f0; }`);
  const [jsCode, setJsCode] = useState(`console.log("Hello from JavaScript!");`);
  const [activeTab, setActiveTab] = useState('html');
  const [activeFile, setActiveFile] = useState(null);
  const [showProjectExplorer, setShowProjectExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [theme, setTheme] = useState('vs-dark');

  const toggleProjectExplorer = () => {
    setShowProjectExplorer(!showProjectExplorer);
  };

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark');
  };

  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };

  const editorDidMount = (editor, monaco) => {
    console.log('editorDidMount', editor);
  }

  useEffect(() => {
    const updatePreview = () => {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        const document = iframe.contentDocument;
        document.open();
        document.write(`<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode}<script>${jsCode}</script></body></html>`);
        document.close();
      }
    };
    updatePreview();
  }, [htmlCode, cssCode, jsCode]);

  return (
    <div className="app-container" style={{ backgroundColor: theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF', color: theme === 'vs-dark' ? '#D4D4D4' : '#000000' }}>
      <div className="header">
        <button onClick={toggleProjectExplorer}>
          {showProjectExplorer ? 'Hide Project Explorer' : 'Show Project Explorer'}
        </button>
        <button onClick={toggleTheme}>
          {theme === 'vs-dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={toggleTerminal}>
          {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
        </button>
      </div>
      <div className="main-area">
        {showProjectExplorer && (
          <div className="project-explorer">
            <ProjectExplorer setHtmlCode={setHtmlCode} setCssCode={setCssCode} setJsCode={setJsCode} setActiveTab={setActiveTab} activeFile={activeFile} setActiveFile={setActiveFile} />
          </div>
        )}
        <div className="code-editor">
          <div className="tab-bar">
            <button onClick={() => setActiveTab('html')} className={activeTab === 'html' ? 'active' : ''}>HTML</button>
            <button onClick={() => setActiveTab('css')} className={activeTab === 'css' ? 'active' : ''}>CSS</button>
            <button onClick={() => setActiveTab('js')} className={activeTab === 'js' ? 'active' : ''}>JavaScript</button>
          </div>
          {activeTab === 'html' && (
            <MonacoEditor
              width="100%"
              height="100%"
              language="html"
              theme={theme}
              value={htmlCode}
              onChange={setHtmlCode}
              editorDidMount={editorDidMount}
            />
          )}
          {activeTab === 'css' && (
            <MonacoEditor
              width="100%"
              height="100%"
              language="css"
              theme={theme}
              value={cssCode}
              onChange={setCssCode}
              editorDidMount={editorDidMount}
            />
          )}
          {activeTab === 'js' && (
            <CodeEditor
              code={jsCode}
              onCodeChange={setJsCode}
            />
          )}
        </div>
        <div className="preview-area">
          <iframe
            title="Live Preview"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </div>
      {showTerminal && <Terminal jsCode={jsCode} />}
    </div>
  );
}

export default App;
