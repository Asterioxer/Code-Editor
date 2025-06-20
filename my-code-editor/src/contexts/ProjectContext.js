import React, { createContext, useState, useEffect, useContext } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Create a React Context for project-related state and actions.
// This helps in managing global state for files, folders, and operations
// without excessive prop drilling.
const ProjectContext = createContext();

// Custom hook to easily consume the ProjectContext in components.
export const useProject = () => useContext(ProjectContext);

// Helper function to generate unique pseudo-random IDs for files and folders.
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default file structure for a new or empty project.
const initialFilesData = [
  { id: generateId(), name: 'src', type: 'folder', children: [
    { id: generateId(), name: 'App.js', type: 'file', content: '// Start coding in App.js\nconsole.log("Hello from App.js!");' },
    { id: generateId(), name: 'index.js', type: 'file', content: '// Entry point for the application' },
    { id: generateId(), name: 'components', type: 'folder', children: [] }, // Example: For UI components
  ]},
  { id: generateId(), name: 'public', type: 'folder', children: [
    { id: generateId(), name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Code Editor Project</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="../src/index.js"></script>\n</body>\n</html>' },
  ]},
  { id: generateId(), name: 'package.json', type: 'file', content: '{ "name": "my-code-editor-project", "version": "0.1.0", "description": "A project created with My Code Editor" }' },
];

// Recursively searches an array of items (files/folders) for an item with a matching ID.
// Used to locate specific files or folders within the project structure.
export const findItemByIdRecursive = (items, id) => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemByIdRecursive(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Recursively searches and applies an update function (`updateFn`) to an item with `targetId`.
// Used for operations like renaming or modifying item properties.
const findAndUpdateRecursive = (items, targetId, updateFn) => {
  return items.map(item => {
    if (item.id === targetId) {
      return updateFn(item); // Apply the update function to the found item.
    }
    if (item.children) {
      // Recursively update children and reconstruct the item with updated children.
      return { ...item, children: findAndUpdateRecursive(item.children, targetId, updateFn) };
    }
    return item;
  }).filter(Boolean); // filter(Boolean) can be used to remove items if updateFn returns null/false, not typical for update.
};

// Recursively removes an item with `targetId` from the project structure.
const removeItemRecursiveInternal = (items, targetId) => {
  return items.reduce((acc, item) => {
    if (item.id === targetId) {
      return acc; // Exclude the item to be deleted.
    }
    if (item.children) {
      const updatedChildren = removeItemRecursiveInternal(item.children, targetId);
      // If children array changed, or if it's an empty folder that wasn't the target, keep the item.
      if (updatedChildren.length !== item.children.length || (item.children.length === 0 && updatedChildren.length === 0) ) {
         acc.push({ ...item, children: updatedChildren });
      } else if (!item.children.find(child => child.id === targetId)) {
         // This condition ensures that if a parent folder of the target is processed,
         // it's still included, as long as it's not the target itself.
        acc.push(item);
      }
    } else {
      acc.push(item); // Keep non-folder items that are not the target.
    }
    return acc;
  }, []);
};

// ProjectProvider component manages the project's state (files, folders)
// and provides functions to interact with this state.
export const ProjectProvider = ({ children }) => {
  // Initialize 'files' state from localStorage or with default data.
  const [files, setFiles] = useState(() => {
    try {
      const savedFiles = localStorage.getItem('myCodeEditor_files');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        // Basic validation: check if it's an array. More robust validation could be added.
        return Array.isArray(parsedFiles) ? parsedFiles : initialFilesData;
      }
    } catch (error) {
      console.error("Error loading files from localStorage:", error);
      // Fallback to initial data if localStorage loading fails.
    }
    return initialFilesData;
  });

  // Effect to save 'files' state to localStorage whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem('myCodeEditor_files', JSON.stringify(files));
    } catch (error) {
      // Handle potential errors, e.g., localStorage full.
      console.error("Error saving files to localStorage:", error);
    }
  }, [files]);

  // Creates a new file. If `folderId` is null, creates at root.
  // Otherwise, creates within the specified folder.
  const handleCreateFile = (folderId) => {
    const fileName = prompt('Enter file name (e.g., component.js):');
    if (!fileName) return; // User cancelled or entered empty name.
    const newFile = { id: generateId(), name: fileName, type: 'file', content: `// New file: ${fileName}\n` };
    if (folderId) {
      setFiles(prevFiles => findAndUpdateRecursive(prevFiles, folderId, folder => ({
        ...folder,
        children: [...(folder.children || []), newFile],
      })));
    } else {
      setFiles(prevFiles => [...prevFiles, newFile]);
    }
  };

  const handleCreateFolder = (folderId) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    const newFolder = { id: generateId(), name: folderName, type: 'folder', children: [] };
    if (folderId) {
      setFiles(prevFiles => findAndUpdateRecursive(prevFiles, folderId, parentFolder => ({
        ...parentFolder,
        children: [...(parentFolder.children || []), newFolder],
      })));
    } else {
      setFiles(prevFiles => [...prevFiles, newFolder]);
    }
  };

  const handleRenameItem = (itemId, newName) => { // newName passed directly
    setFiles(prevFiles => findAndUpdateRecursive(prevFiles, itemId, item => ({ ...item, name: newName })));
  };

  const handleDeleteItem = (itemId) => { // Confirmation should be handled by caller if needed
    setFiles(prevFiles => removeItemRecursiveInternal(prevFiles, itemId));
  };

  const updateFileContent = (fileId, newContent) => {
    setFiles(prevFiles =>
      findAndUpdateRecursive(prevFiles, fileId, file => ({
        ...file,
        content: newContent,
      }))
    );
  };

  // Placeholder for other states and handlers that will be moved from App.js
  // For now, these are directly related to 'files' state and its manipulation.

  const value = {
    files,
    setFiles, // Expose setFiles for import functionality for now
    createFile: handleCreateFile,
    createFolder: handleCreateFolder,
    renameItem: handleRenameItem,
    deleteItem: handleDeleteItem,
    updateFileContent,
    findItemByIdRecursive, // Exporting for App.js to use for openTabs/activeFile reconstruction
    generateId, // Exporting for App.js to use for importProject new items
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
