import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function Terminal({ jsCode }) {
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [typedOutput, setTypedOutput] = useState('');
  const terminalRef = useRef(null);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleRun = () => {
    // Capture console.log output
    let consoleOutput = '';
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      consoleOutput += args.join(' ') + '\\n';
      originalConsoleLog(...args);
    };

    try {
      // Execute the JavaScript code
      const script = new Function(jsCode);
      const result = script();
      let newOutput = '';
      if (typeof result === 'object' && result !== null) {
        newOutput = '\n' + JSON.stringify(result, null, 2) + '\\n' + consoleOutput;
      } else {
        newOutput = '\n' + result + '\\n' + consoleOutput;
      }

      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < newOutput.length) {
          setTypedOutput(prev => prev + newOutput[i]);
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 10);

    } catch (error) {
      setOutput(output + '\\n' + error.message);
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
    setInput('');
  };

  const handleClear = () => {
    setOutput('');
    setTypedOutput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [typedOutput]);

  return (
    <div style={{ backgroundColor: '#1E1E1E', color: '#D4D4D4', padding: '10px', height: '300px', display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>Terminal</span>
        <div>
          <button onClick={handleRun} style={{ backgroundColor: '#282A36', color: '#D4D4D4', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Run</button>
          <button onClick={handleClear} style={{ backgroundColor: '#282A36', color: '#D4D4D4', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Clear</button>
        </div>
      </div>
      <div ref={terminalRef} style={{ overflow: 'auto', flexGrow: 1, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
        <ReactMarkdown>{typedOutput}</ReactMarkdown>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
        <span style={{ marginRight: '5px' }}>&gt;&gt;&gt;</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter command..."
          style={{ backgroundColor: '#282A36', color: '#D4D4D4', border: 'none', padding: '5px', flexGrow: 1, fontFamily: 'monospace', fontSize: '14px' }}
        />
      </div>
    </div>
  );
}

export default Terminal;
