import React, { useState } from 'react';

// NewFileExplorer is now a presentational component.
// It receives files data and handlers from App.js.
const NewFileExplorer = ({
  files,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRenameItem,
  onDeleteItem
}) => {
  const [selectedFileId, setSelectedFileId] = useState(null); // For highlighting selection

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      setSelectedFileId(file.id);
      if (onFileSelect) {
        onFileSelect(file); // Pass the selected file object up to App.js
      }
    }
    // Optionally, handle folder clicks here if you want to expand/collapse them
    // For now, clicking a folder name does nothing beyond display.
  };

  const renderFileTree = (items, parentId = null) => {
    return (
      <ul style={{ paddingLeft: parentId ? '20px' : '0', listStyleType: 'none' }}>
        {items.map(item => (
          <li key={item.id} style={{ marginBottom: '5px' }}>
            <span
              onClick={() => handleFileClick(item)}
              style={{
                cursor: item.type === 'file' ? 'pointer' : 'default',
                fontWeight: selectedFileId === item.id ? 'bold' : 'normal'
              }}
            >
              {item.type === 'folder' ? <strong>{item.name}</strong> : item.name}
            </span>
            {/* Action buttons now call handlers passed via props */}
            <button onClick={() => onRenameItem(item.id)} style={{ marginLeft: '5px', fontSize: '0.8em' }}>Rename</button>
            <button onClick={() => onDeleteItem(item.id)} style={{ marginLeft: '5px', fontSize: '0.8em' }}>Delete</button>
            {item.type === 'folder' && (
              <>
                <button onClick={() => onCreateFile(item.id)} style={{ marginLeft: '5px', fontSize: '0.8em' }}>+ File</button>
                <button onClick={() => onCreateFolder(item.id)} style={{ marginLeft: '5px', fontSize: '0.8em' }}>+ Folder</button>
              </>
            )}
            {item.children && item.children.length > 0 && renderFileTree(item.children, item.id)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="file-explorer">
      <h3>File Explorer</h3>
      {/* Buttons to create items at the root level */}
      <button onClick={() => onCreateFile(null)} style={{ marginBottom: '10px' }}>Create File at Root</button>
      <button onClick={() => onCreateFolder(null)} style={{ marginBottom: '10px', marginLeft: '5px' }}>Create Folder at Root</button>
      {renderFileTree(files)}
    </div>
  );
};

export default NewFileExplorer;
