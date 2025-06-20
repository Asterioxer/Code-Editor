import React from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {dark} from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeEditor({ code, onCodeChange }) {

  const handleCodeChange = (event) => {
    onCodeChange(event.target.value);
  };

  return (
    <div style={{ backgroundColor: '#1E1E1E', color: '#D4D4D4', padding: '10px', height: '300px', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
      <SyntaxHighlighter language="javascript" style={dark} customStyle={{ backgroundColor: '#282A36', color: '#D4D4D4', border: 'none', padding: '5px', flexGrow: 1, fontFamily: 'monospace', fontSize: '14px', resize: 'none', overflow: 'auto' }} value={code} />
    <textarea
        value={code}
        onChange={handleCodeChange}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1, resize: 'none', backgroundColor: 'transparent', color: 'transparent', border: 'none', padding: '5px', fontFamily: 'monospace', fontSize: '14px' }}
      />
    </div>
  );
}

export default CodeEditor;
