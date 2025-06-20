import React, { useState } from 'react';

function ProjectExplorer({ setHtmlCode, setCssCode, setJsCode, setActiveTab }) {
  const [files, setFiles] = useState(['App.js', 'index.js', 'index.html']);

  const handleFileSelect = (file) => {
    switch (file) {
      case 'App.js':
        setHtmlCode(`<div><h1>App.js</h1></div>`);
        setActiveTab('js');
        break;
      case 'index.js':
        setHtmlCode(`<div><h1>index.js</h1></div>`);
        setActiveTab('js');
        break;
      case 'index.html':
        setHtmlCode(`<div><h1>index.html</h1></div>`);
        setActiveTab('html');
        break;
      default:
        setHtmlCode(`<div><h1>${file}</h1></div>`);
        setActiveTab('html');
    }
  };

  const handleRenameFile = (file) => {
    const newFileName = prompt(`Enter new file name: ${file}`);
    if (newFileName) {
      // TODO: Update the file list with the new file name
    }
  };

  return (
    <div>
      <h2>Project Explorer</h2>
      <ul>
        <li>src</li>
        <ul>
          <li style={{ cursor: 'pointer' }}>
            <span onClick={() => handleFileSelect('App.js')}>App.js</span>
            <button onClick={() => handleRenameFile('App.js')}>Rename</button>
          </li>
          <li style={{ cursor: 'pointer' }}>
            <span onClick={() => handleFileSelect('index.js')}>index.js</span>
            <button onClick={() => handleRenameFile('index.js')}>Rename</button>
          </li>
        </ul>
        <li>public</li>
        <ul>
          <li style={{ cursor: 'pointer' }}>
            <span onClick={() => handleFileSelect('index.html')}>index.html</span>
            <button onClick={() => handleRenameFile('index.html')}>Rename</button>
          </li>
        </ul>
      </ul>
    </div>
  );
}

export default ProjectExplorer;
