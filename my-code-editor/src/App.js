import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import NewFileExplorer from './components/NewFileExplorer';
import Terminal from './components/Terminal/Terminal';
import SplitPane from 'react-split-pane';
import 'react-split-pane/lib/SplitPane.css'; // Default styling
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import axe from 'axe-core';
import Header from './components/Header';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import WorkspaceLayout from './components/WorkspaceLayout'; // Import WorkspaceLayout
// import CodeEditor from './components/CodeEditor'; // Removing old CodeEditor
import './App.css';

// Top-level helper functions and initialFiles have been removed.
// They are managed by ProjectContext.

// This is the main application content, now separated to consume the context
const AppContent = () => {
  const project = useProject();
  const {
    files,
    createFile: contextCreateFile,
    createFolder: contextCreateFolder,
    renameItem: contextRenameItem,
    deleteItem: contextDeleteItem,
    updateFileContent: contextUpdateFileContent,
    findItemByIdRecursive,
    generateId: contextGenerateId,
    setFiles: contextSetFiles,
  } = project;

  const [openTabs, setOpenTabs] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [showProjectExplorer, setShowProjectExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [accessibilityIssues, setAccessibilityIssues] = useState([]);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [theme, setTheme] = useState('vs-dark'); // UI theme

  // --- Project Import/Export Handlers ---
  const handleExportProject = () => {
    const zip = new JSZip();
    const addFilesToZipRecursive = (currentZipFolder, items) => {
      items.forEach(item => {
        if (item.type === 'file') {
          currentZipFolder.file(item.name, item.content || '');
        } else if (item.type === 'folder') {
          const folder = currentZipFolder.folder(item.name);
          if (item.children && item.children.length > 0) {
            addFilesToZipRecursive(folder, item.children);
          }
        }
      });
    };
    addFilesToZipRecursive(zip, files); // files from context
    zip.generateAsync({ type: 'blob' })
      .then(content => {
        saveAs(content, 'project.zip');
      })
      .catch(err => {
        console.error("Error exporting project:", err);
      });
  };

  const handleImportProject = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = null;
    if (!confirm("Importing a new project will replace the current one. Continue?")) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const newProjectFiles = [];
      const pendingPromises = [];
      const ensurePath = (items, pathParts) => {
        let currentLevel = items;
        for (let i = 0; i < pathParts.length -1; ++i) {
          const part = pathParts[i];
          let folder = currentLevel.find(f => f.name === part && f.type === 'folder');
          if (!folder) {
            folder = { id: contextGenerateId(), name: part, type: 'folder', children: [] };
            currentLevel.push(folder);
          }
          currentLevel = folder.children;
        }
        return currentLevel;
      };
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('string').then(content => {
            const pathParts = zipEntry.name.split('/').filter(p => p.length > 0);
            const fileName = pathParts.pop();
            const parentChildrenArray = ensurePath(newProjectFiles, [ ...pathParts, fileName ]);
            if (!parentChildrenArray.find(f => f.name === fileName && f.type === 'file')) {
                 parentChildrenArray.push({
                    id: contextGenerateId(),
                    name: fileName,
                    type: 'file',
                    content: content,
                 });
            }
          });
          pendingPromises.push(promise);
        } else {
            const pathParts = zipEntry.name.split('/').filter(p => p.length > 0);
            if (pathParts.length > 0) {
                 ensurePath(newProjectFiles, [ ...pathParts, 'dummyChild']);
            }
        }
      });
      await Promise.all(pendingPromises);
      contextSetFiles(newProjectFiles);
      setOpenTabs([]);
      setActiveFile(null);
      console.log("Project imported successfully.");
    } catch (error) {
      console.error("Error importing project:", error);
      alert("Failed to import project. The file might be corrupted or not a valid .zip archive.");
    }
  };

  // --- UI State Persistence ---
  // Effect for initializing openTabs and activeFile from localStorage.
  // Runs when `files` (from ProjectContext) are loaded/changed, ensuring consistency.
  useEffect(() => {
    if (files && files.length > 0) {
        try {
            const savedOpenTabIds = localStorage.getItem('myCodeEditor_openTabIds');
            let reconstructedOpenTabs = [];
            if (savedOpenTabIds) {
                const parsedOpenTabIds = JSON.parse(savedOpenTabIds);
                if (Array.isArray(parsedOpenTabIds)) {
                    reconstructedOpenTabs = parsedOpenTabIds
                        .map(id => findItemByIdRecursive(files, id))
                        .filter(Boolean); // Filter out nulls if a file ID from LS is no longer in `files`
                    setOpenTabs(reconstructedOpenTabs);
                }
            }

            const savedActiveFileId = localStorage.getItem('myCodeEditor_activeFileId');
            if (savedActiveFileId) {
                const reconstructedActiveFile = findItemByIdRecursive(files, savedActiveFileId);
                // Ensure the loaded active file is actually one of the open tabs
                if (reconstructedActiveFile && reconstructedOpenTabs.find(tab => tab.id === reconstructedActiveFile.id)) {
                    setActiveFile(reconstructedActiveFile);
                } else if (reconstructedOpenTabs.length > 0) {
                    // Fallback: if saved active file isn't valid or not in open tabs, set first open tab as active
                    setActiveFile(reconstructedOpenTabs[0]);
                }
            } else if (reconstructedOpenTabs.length > 0) {
                 // Fallback: if no activeFileId was saved, but there are open tabs, set first one active
                setActiveFile(reconstructedOpenTabs[0]);
            }
        } catch (error) {
            console.error("Error loading UI state (tabs/activeFile) from localStorage:", error);
            setOpenTabs([]); // Reset to default on error
            setActiveFile(null);
        }
    }
  }, [files, findItemByIdRecursive]);

  // Effect to save UI-specific state (openTabs IDs and activeFile ID) to localStorage.
  useEffect(() => {
    try {
      const openTabIds = openTabs.map(tab => tab.id);
      localStorage.setItem('myCodeEditor_openTabIds', JSON.stringify(openTabIds));
      if (activeFile) {
        localStorage.setItem('myCodeEditor_activeFileId', activeFile.id);
      } else {
        localStorage.removeItem('myCodeEditor_activeFileId');
      }
    } catch (error) {
      console.error("Error saving active file ID to localStorage:", error);
    }
  }, [activeFile]);


  const toggleProjectExplorer = () => setShowProjectExplorer(!showProjectExplorer);
  const toggleTheme = () => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark');
  const toggleTerminal = () => setShowTerminal(!showTerminal);

  const toggleProjectExplorer = () => setShowProjectExplorer(!showProjectExplorer);
  const toggleTheme = () => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark');
  const toggleTerminal = () => setShowTerminal(!showTerminal);

  // --- File/Folder Action Handlers (delegating to context) ---
  const handleCreateFile = (folderId) => {
    contextCreateFile(folderId); // Uses context function
  };

  const handleCreateFolder = (folderId) => {
    contextCreateFolder(folderId); // Uses context function
  };

  const handleRenameItem = (itemId) => {
    const newName = prompt('Enter new name:');
    if (!newName) return;
    contextRenameItem(itemId, newName); // Uses context function
    // If the renamed item is the active file, update its name in AppContent's state
    if (activeFile && activeFile.id === itemId) {
      setActiveFile(prevActiveFile => ({ ...prevActiveFile, name: newName }));
    }
  };

  const handleDeleteItem = (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    contextDeleteItem(itemId); // Uses context function
    // Update UI state (openTabs, activeFile) after deletion
    const newOpenTabs = openTabs.filter(tab => tab.id !== itemId);
    setOpenTabs(newOpenTabs);
    if (activeFile && activeFile.id === itemId) {
      if (newOpenTabs.length > 0) {
        const currentIndex = openTabs.findIndex(t => t.id === itemId);
        setActiveFile(newOpenTabs[Math.max(0, currentIndex -1)]);
      } else {
        setActiveFile(null);
      }
    }
  };

  // --- Editor and Tab UI Handlers ---
  const editorDidMount = (editor, monaco) => {
    console.log('editorDidMount', editor);
    editor.focus(); // Focus the editor when it mounts
  };

  // Called when a file is selected in the NewFileExplorer
  const handleFileSelect = (fileFromExplorer) => {
    const fileToOpen = findItemByIdRecursive(files, fileFromExplorer.id);
    if (!fileToOpen) return;
    // Add to openTabs if not already present
    if (!openTabs.find(tab => tab.id === fileToOpen.id)) {
      setOpenTabs([...openTabs, fileToOpen]);
    }
    setActiveFile(fileToOpen); // Set as the currently active file for editing
  };

  // Called when a tab is clicked
  const handleTabClick = (file) => {
    setActiveFile(file);
  };

  // Called when a tab's close button is clicked
  const handleCloseTab = (fileIdToClose, event) => {
    event.stopPropagation(); // Prevent the tab click from also firing
    const tabIndexToClose = openTabs.findIndex(tab => tab.id === fileIdToClose);
    const newOpenTabs = openTabs.filter(tab => tab.id !== fileIdToClose);
    setOpenTabs(newOpenTabs);

    // If the closed tab was the active one, determine the next active tab
    if (activeFile && activeFile.id === fileIdToClose) {
      if (newOpenTabs.length > 0) {
        // Try to set the previous tab as active, or the first if closing the first tab
        setActiveFile(newOpenTabs[Math.max(0, tabIndexToClose -1)]);
      } else {
        setActiveFile(null); // No tabs left open
      }
    }
  };

  // Called when MonacoEditor content changes
  const handleEditorChange = (newValue, e) => {
    if (activeFile) {
      contextUpdateFileContent(activeFile.id, newValue); // Update content in global state (ProjectContext)
      // Update local activeFile state to reflect the change immediately in the editor
      setActiveFile(prev => ({ ...prev, content: newValue }));
    }
  };

  // --- Effects for State Synchronization ---
  // Effect to synchronize `activeFile` and `openTabs` (local UI state)
  // with the global `files` state from ProjectContext.
  // This handles cases like file renames or deletions occurring via context
  // that need to be reflected in the currently open tabs or active editor.
  useEffect(() => {
    if (activeFile) {
      const currentActiveFileInGlobalState = findItemByIdRecursive(files, activeFile.id);
      if (currentActiveFileInGlobalState) {
        if (currentActiveFileInGlobalState.name !== activeFile.name || currentActiveFileInGlobalState.content !== activeFile.content) {
          // Keep local activeFile.content if it's the source of truth (i.e., editor just changed it)
          // but update name if that changed globally.
          setActiveFile(prev => ({
            ...prev,
            name: currentActiveFileInGlobalState.name,
            // content: currentActiveFileInGlobalState.content // This might revert user's unsaved changes in editor
          }));
        }
      } else {
        // Active file was deleted from `files` state (e.g. by another user/tab if this was collaborative)
        // Check if it's still in openTabs by its ID. If not, nullify activeFile.
        // This logic is also partly in handleDeleteItem for immediate feedback.
        if (!openTabs.find(t => t.id === activeFile.id)) {
            setActiveFile(null);
        }
      }
    }
    // Sync openTabs with the global files state
    setOpenTabs(prevTabs =>
      prevTabs
        .map(tab => {
            const fileData = findItemByIdRecursive(files, tab.id);
            return fileData ? {...tab, name: fileData.name, content: fileData.content } : null; // Update tab with latest data or mark for removal
        })
        .filter(Boolean) // Remove tabs for files that no longer exist in global state
    );
  }, [files, findItemByIdRecursive]); // Removed activeFile.id to allow activeFile to be set to null if deleted from files


  // Keyboard shortcut for Ctrl+S (Cmd+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S or Cmd+S for saving
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (activeFile) {
          console.log(`File '${activeFile.name}' content saved to state.`);
        } else {
          console.log('No active file to save.');
        }
      }
      // Escape key to exit Zen mode
      if (event.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFile, isZenMode]);


  // Startup Sound Effect (runs once on mount)
  useEffect(() => {
    // In a real app, ensure user interaction first or handle autoplay policies.
    // const audio = new Audio('/sounds/startup_sound.mp3'); // Assuming sound in public/sounds
    // audio.play().catch(error => console.log("Startup sound autoplay blocked:", error));
    console.log("Startup sound would play here (if a sound file was available and autoplay allowed).");
  }, []);


  useEffect(() => {
    const iframe = document.getElementById('preview-iframe'); // Give iframe an ID
    if (iframe) {
      iframe.onload = () => { // Ensure content is loaded before running axe
        if (activeFile && getLanguageForFile(activeFile.name) === 'html' && iframe.contentDocument) {
          axe.run(iframe.contentDocument, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } // Example configuration
          })
          .then(results => {
            setAccessibilityIssues(results.violations);
            setShowAccessibilityPanel(results.violations.length > 0);
          })
          .catch(err => {
            console.error('Error running axe-core:', err);
            setAccessibilityIssues([]);
          });
        } else {
          setAccessibilityIssues([]); // Clear issues if not an HTML file or no content
        }
      };

      // Set content
      const doc = iframe.contentDocument;
      doc.open();
      if (activeFile && getLanguageForFile(activeFile.name) === 'html' && activeFile.content) {
        doc.write(activeFile.content);
      } else {
        doc.write('<!DOCTYPE html><html><head><title>Preview</title></head><body>Select an HTML file to preview, or content is empty.</body></html>');
        setAccessibilityIssues([]); // Clear issues for non-HTML previews
      }
      doc.close();

    } else {
      setAccessibilityIssues([]);
    }
  }, [activeFile, files, theme]); // Rerun when activeFile, its content (via files), or theme changes

  // Determine language for MonacoEditor based on file extension
  const getLanguageForFile = (fileName) => {
    if (!fileName) return 'plaintext';
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'js' || extension === 'jsx') return 'javascript';
    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'css') return 'css';
    if (extension === 'json') return 'json';
    if (extension === 'ts' || extension === 'tsx') return 'typescript';
    if (extension === 'py') return 'python';
    if (extension === 'java' || extension === 'class') return 'java';
    if (extension === 'c' || extension === 'h') return 'c';
    if (extension === 'cpp' || extension === 'hpp' || extension === 'cxx') return 'cpp';
    if (extension === 'cs') return 'csharp';
    if (extension === 'php') return 'php';
    if (extension === 'rb') return 'ruby';
    if (extension === 'go') return 'go';
    if (extension === 'rs') return 'rust';
    if (extension === 'md' || extension === 'markdown') return 'markdown';
    if (extension === 'xml') return 'xml';
    if (extension === 'yml' || extension === 'yaml') return 'yaml';
    if (extension === 'sh') return 'shell';
    if (extension === 'sql') return 'sql';
    return 'plaintext';
  };

  const importFileInput = <input type="file" id="import-project-input" accept=".zip" onChange={handleImportProject} style={{ display: 'none' }} />;
  const triggerImport = () => document.getElementById('import-project-input').click();


  if (isZenMode) {
    return (
      <div className="app-container zen-mode" style={{ backgroundColor: theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF', color: theme === 'vs-dark' ? '#D4D4D4' : '#000000', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
        {activeFile ? (
          <MonacoEditor
            width="100%"
            height="100%"
            language={getLanguageForFile(activeFile.name)}
            theme={theme}
            value={activeFile.content || ''}
            onChange={handleEditorChange}
            editorDidMount={(editor, monaco) => { editorDidMount(editor, monaco); editor.focus(); }}
            options={{ automaticLayout: true }}
          />
        ) : (
          <div style={{textAlign: 'center', paddingTop: '50px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
            <p>No file selected. Exit Zen Mode (Esc) to select a file.</p>
            <button onClick={() => setIsZenMode(false)} style={{padding: '10px', marginTop: '20px'}}>Exit Zen Mode</button>
          </div>
        )}
         <button
            onClick={() => setIsZenMode(false)}
            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, padding: '5px 10px', cursor: 'pointer' }}
            title="Exit Zen Mode (Esc)"
          >
            Exit Zen
          </button>
      </div>
    );
  }

  const projectExplorerPanel = showProjectExplorer && !isZenMode ? (
    <div className="project-explorer" style={{overflowY: 'auto', height: '100%', background: theme === 'vs-dark' ? '#252526': '#f3f3f3' }}>
      <NewFileExplorer
        files={files}
        onFileSelect={handleFileSelect}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onRenameItem={handleRenameItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  ) : null; // Pass null if not shown to WorkspaceLayout

  const editorPanel = !isZenMode ? (
    <div className="code-editor" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="tab-bar" style={{ display: 'flex', overflowX: 'auto', backgroundColor: theme === 'vs-dark' ? '#252526' : '#F3F3F3', padding: '5px 0', flexShrink: 0 }}>
        {openTabs.map(tabFile => (
          <button
            key={tabFile.id}
            onClick={() => handleTabClick(tabFile)}
            className={activeFile && activeFile.id === tabFile.id ? 'active' : ''}
            title={tabFile.name}
            style={{
              padding: '5px 10px', border: 'none', cursor: 'pointer',
              backgroundColor: activeFile && activeFile.id === tabFile.id ? (theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF') : 'transparent',
              color: theme === 'vs-dark' ? '#D4D4D4' : '#000000',
              borderRight: theme === 'vs-dark' ? '1px solid #333' : '1px solid #ccc',
              display: 'flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap'
            }}
          >
            {tabFile.name}
            <span
              onClick={(e) => handleCloseTab(tabFile.id, e)}
              style={{ marginLeft: '8px', cursor: 'pointer', padding: '0 5px', borderRadius: '3px', lineHeight: '1' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'vs-dark' ? '#555' : '#ddd'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              &times;
            </span>
          </button>
        ))}
        {openTabs.length === 0 && <span style={{padding: '5px 10px', fontStyle: 'italic'}}>No files open</span>}
      </div>
      {activeFile ? (
        <MonacoEditor
          width="100%" height="100%"
          language={getLanguageForFile(activeFile.name)}
          theme={theme} value={activeFile.content || ''}
          onChange={handleEditorChange} editorDidMount={editorDidMount}
          options={{ automaticLayout: true }}
        />
      ) : (
        <div style={{textAlign: 'center', paddingTop: '50px', height: '100%'}}>Please select a file to view its content.</div>
      )}
    </div>
  ) : null;

  const previewPanel = !isZenMode ? (
    <div className="preview-area" style={{ height: '100%', overflow: 'auto', background: theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF' }}>
      <iframe
        id="preview-iframe" title="Live Preview" width="100%" height="100%"
        style={{ border: 'none', display: 'block' }} sandbox="allow-scripts"
      />
    </div>
  ) : null;

  const terminalPanelToShow = (!isZenMode && showTerminal) ? (
    <div
        className="terminal-container"
        style={{
            height: '200px', backgroundColor: theme === 'vs-dark' ? '#181818' : '#f0f0f0',
            borderTop: '1px solid #444', display: 'flex', flexDirection: 'column',
            flexShrink: 0
        }}
    >
      <Terminal jsCode={activeFile && getLanguageForFile(activeFile.name) === 'javascript' ? activeFile.content : ''} />
    </div>
  ) : null;

  const accessibilityPanelToShow = (!isZenMode && showAccessibilityPanel && accessibilityIssues.length > 0) ? (
    <div className="accessibility-panel" style={{ height: '200px', overflowY: 'auto', padding: '10px', backgroundColor: theme === 'vs-dark' ? '#252526' : '#f3f3f3', borderTop: '1px solid #444', flexShrink: 0 }}>
      <h4>Accessibility Issues ({accessibilityIssues.length})</h4>
      {accessibilityIssues.length === 0 ? <p>No issues found.</p> : (
        <ul>
          {accessibilityIssues.map((issue, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{issue.impact === 'critical' ? '🔴 CRITICAL: ' : issue.impact === 'serious' ? '🟠 SERIOUS: ' : '🟡 MINOR: '}</strong>
              {issue.description} (<a href={issue.helpUrl} target="_blank" rel="noopener noreferrer">Learn more</a>)
              <br/>Affected Nodes:
              <ul>{issue.nodes.map((node, i) => <li key={i}><pre style={{whiteSpace: 'pre-wrap'}}>{node.html}</pre></li>)}</ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div className="app-container" style={{ backgroundColor: theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF', color: theme === 'vs-dark' ? '#D4D4D4' : '#000000' }}>
      {!isZenMode && (
        <Header
          theme={theme}
          showProjectExplorer={showProjectExplorer}
          showTerminal={showTerminal}
          showAccessibilityPanel={showAccessibilityPanel}
          accessibilityIssuesCount={accessibilityIssues.length}
          onToggleProjectExplorer={toggleProjectExplorer}
          onToggleTheme={toggleTheme}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          onToggleAccessibilityPanel={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
          onToggleZenMode={() => setIsZenMode(true)}
          onTriggerImport={triggerImport}
          onExportProject={handleExportProject}
        />
      )}
      {importFileInput} {/* Keep the actual input element here, though hidden */}

      <div className="main-area" style={{ height: isZenMode ? '100vh' : 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
        <SplitPane
          split="vertical"
          minSize={150}
          defaultSize={250}
          style={{
            position: 'relative',
            height: (!isZenMode && (showTerminal || (showAccessibilityPanel && accessibilityIssues.length > 0))) ? 'calc(100% - 230px)' : '100%',
            display: isZenMode ? 'none' : 'flex' // Hide SplitPane in Zen Mode
          }}
        >
          {showProjectExplorer && !isZenMode ? (
            <div className="project-explorer" style={{overflowY: 'auto', height: '100%', background: theme === 'vs-dark' ? '#252526': '#f3f3f3' }}>
              <NewFileExplorer
                files={files}
                onFileSelect={handleFileSelect}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRenameItem={handleRenameItem}
                onDeleteItem={handleDeleteItem}
              />
            </div>
          ) : <div style={{display: 'none'}} /> }

          <SplitPane split="vertical" minSize={200} defaultSize={500} primary="second" style={{ display: isZenMode ? 'none' : 'flex' }}>
            <div className="code-editor" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {!isZenMode && (
                <div className="tab-bar" style={{ display: 'flex', overflowX: 'auto', backgroundColor: theme === 'vs-dark' ? '#252526' : '#F3F3F3', padding: '5px 0', flexShrink: 0 }}>
                  {openTabs.map(tabFile => (
                    <button
                      key={tabFile.id}
                      onClick={() => handleTabClick(tabFile)}
                      className={activeFile && activeFile.id === tabFile.id ? 'active' : ''}
                      title={tabFile.name}
                      style={{
                        padding: '5px 10px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: activeFile && activeFile.id === tabFile.id ? (theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF') : 'transparent',
                        color: theme === 'vs-dark' ? '#D4D4D4' : '#000000',
                        borderRight: theme === 'vs-dark' ? '1px solid #333' : '1px solid #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tabFile.name}
                      <span
                        onClick={(e) => handleCloseTab(tabFile.id, e)}
                        style={{ marginLeft: '8px', cursor: 'pointer', padding: '0 5px', borderRadius: '3px', lineHeight: '1' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'vs-dark' ? '#555' : '#ddd'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        &times;
                      </span>
                    </button>
                  ))}
                  {openTabs.length === 0 && <span style={{padding: '5px 10px', fontStyle: 'italic'}}>No files open</span>}
                </div>
              )}
              {activeFile ? (
                <MonacoEditor
                  width="100%"
                  height="100%"
                  language={getLanguageForFile(activeFile.name)}
                  theme={theme}
                  value={activeFile.content || ''}
                  onChange={handleEditorChange}
                  editorDidMount={editorDidMount}
                  options={{ automaticLayout: true }}
                />
              ) : (
                <div style={{textAlign: 'center', paddingTop: '50px', height: '100%'}}>Please select a file to view its content.</div>
              )}
            </div>
            <div className="preview-area" style={{ height: '100%', overflow: 'auto', background: theme === 'vs-dark' ? '#1E1E1E' : '#FFFFFF', display: isZenMode ? 'none' : 'block' }}>
              <iframe
                id="preview-iframe"
                title="Live Preview"
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block' }}
                sandbox="allow-scripts"
              />
            </div>
          </SplitPane>
        </SplitPane>

      {(!isZenMode && showAccessibilityPanel && accessibilityIssues.length > 0) && (
        <div className="accessibility-panel" style={{ height: '200px', overflowY: 'auto', padding: '10px', backgroundColor: theme === 'vs-dark' ? '#252526' : '#f3f3f3', borderTop: '1px solid #444', flexShrink: 0 }}>
          <h4>Accessibility Issues ({accessibilityIssues.length})</h4>
          {accessibilityIssues.length === 0 ? <p>No issues found.</p> : (
            <ul>
              {accessibilityIssues.map((issue, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <strong>{issue.impact === 'critical' ? '🔴 CRITICAL: ' : issue.impact === 'serious' ? '🟠 SERIOUS: ' : '🟡 MINOR: '}</strong>
                  {issue.description} (<a href={issue.helpUrl} target="_blank" rel="noopener noreferrer">Learn more</a>)
                  <br/>
                  Affected Nodes:
                  <ul>
                    {issue.nodes.map((node, i) => <li key={i}><pre style={{whiteSpace: 'pre-wrap'}}>{node.html}</pre></li>)}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(!isZenMode && showTerminal) && (
        <div
            className="terminal-container"
            style={{
                height: '200px',
                backgroundColor: theme === 'vs-dark' ? '#181818' : '#f0f0f0',
                borderTop: '1px solid #444',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}
        >
          <Terminal jsCode={activeFile && getLanguageForFile(activeFile.name) === 'javascript' ? activeFile.content : ''} />
        </div>
      )}
    </div>
  );
}

export default App;
