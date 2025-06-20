import React, { useState } from 'react';

function FileExplorer({ setHtmlCode, setCssCode, setJsCode, setActiveTab, activeFile, setActiveFile }) {
  const [files, setFiles] = useState(['index.html', 'style.css', 'script.js']);

  const handleCreateFile = () => {
    const newFileName = prompt('Enter file name:');
    if (newFileName) {
      setFiles([...files, newFileName]);
    }
  };

  const handleFileSelect = (file) => {
    // Here you would fetch the file content and update the code state
    // For now, we'll just set some default content based on the file name
    let fileContent = '';
    switch (file) {
      case 'index.html':
        fileContent = '<!DOCTYPE html><html><head><title>Index</title></head><body><h1>Index Page</h1></body></html>';
        break;
      case 'style.css':
        fileContent = 'body { background-color: #f0f0f0; }';
        break;
      case 'script.js':
        fileContent = 'console.log("Hello from script.js");';
        break;
      default:
        fileContent = `<h1>Content of ${file}</h1>`;
    }

    if (file.endsWith('.html')) {
      setHtmlCode(fileContent);
      setActiveTab('html');
    } else if (file.endsWith('.css')) {
      setCssCode(fileContent);
      setActiveTab('css');
    } else if (file.endsWith('.js')) {
      setJsCode(fileContent);
      setActiveTab('js');
    }
    setActiveFile(file);
  };

  return (
    <div style={{ transition: 'all 0.3s ease-in-out' }}>
      <h2>
        File Explorer
        <button onClick={handleCreateFile} style={{ transition: 'all 0.3s ease-in-out' }}>+</button>
      </h2>
      <ul>
        {files.map((file, index) => (
          <li
            key={index}
            onClick={() => handleFileSelect(file)}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease-in-out' }}
            className={activeFile === file ? 'active' : ''}
          >
            {file}
          </li>
        ))}
      </ul>
      <style>
        {`
          .active {
            background-color: #3E4049;
          }
        `}
      </style>
    </div>
  );
}

export default FileExplorer;
