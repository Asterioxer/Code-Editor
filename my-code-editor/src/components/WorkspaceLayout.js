import React from 'react';
import SplitPane from 'react-split-pane';
import 'react-split-pane/lib/SplitPane.css';

const WorkspaceLayout = (props) => {
  const {
    theme, // Needed for styling some child divs if not handled by CSS classes
    showProjectExplorer,
    projectExplorerPanel, // JSX for Project Explorer
    editorPanel,          // JSX for Code Editor + Tabs
    previewPanel,         // JSX for Preview Iframe
    showTerminal,
    terminalPanel,        // JSX for Terminal
    showAccessibilityPanel,
    accessibilityPanel,   // JSX for Accessibility Issues
    isZenMode, // Though in Zen mode this component might not be rendered at all by AppContent
  } = props;

  if (isZenMode) {
    // In Zen mode, AppContent directly renders only the editor or a message.
    // So, this component effectively wouldn't be used, or would render null.
    return null;
  }

  // Calculate height for the main content area (Explorer | Editor/Preview)
  // This depends on whether bottom panels (Terminal, Accessibility) are visible.
  let bottomPanelHeight = 0;
  if (showTerminal) bottomPanelHeight += 200; // Assuming fixed height for terminal
  if (showAccessibilityPanel) bottomPanelHeight += 200; // Assuming fixed height for a11y panel
  // Ensure bottomPanelHeight doesn't exceed a reasonable amount if both are shown (e.g. max 400px for bottom area)
  // This logic might need refinement if they are to be tabbed or stacked differently.
  // For now, let's assume they stack and App.js controls which one is primary if both are "shown".
  // Or, let's assume only one can be "active" at a time from App.js logic, or they are stacked.
  // The current App.js CSS implies they stack, so height adjustment is important.
  // A more robust way would be a single "bottomPanel" prop and App.js decides what's in it.
  // For now, let's assume they are additive for height calculation for the top SplitPane.
  let mainSplitPaneHeight = '100%';
  let totalBottomPanelHeight = 0;

  if (showTerminal && terminalPanel) {
    totalBottomPanelHeight += 200; // Assuming 200px for terminal
  }
  if (showAccessibilityPanel && accessibilityPanel) {
    totalBottomPanelHeight += 200; // Assuming 200px for accessibility panel
  }

  if (totalBottomPanelHeight > 0) {
    // Max height for bottom area to prevent it from taking too much space
    // This logic might need to be smarter if panels are tabbed or only one is shown at a time.
    // For now, if both are "shown", they stack, so we subtract total.
    mainSplitPaneHeight = `calc(100% - ${totalBottomPanelHeight}px)`;
  }

  return (
    <div className="workspace-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SplitPane
        split="vertical"
        minSize={showProjectExplorer ? 150 : 0} // Allow collapsing fully
        defaultSize={showProjectExplorer ? 250 : 0}
        size={showProjectExplorer ? undefined : 0} // Controlled size when hidden
        pane1Style={showProjectExplorer ? { overflowY: 'auto', height: '100%' } : { width: '0px !important', overflow: 'hidden' }}
        resizerStyle={showProjectExplorer ? {} : { display: 'none' }} // Hide resizer when explorer is hidden
        style={{
          position: 'relative',
          height: mainSplitPaneHeight,
        }}
      >
        {/* Ensure projectExplorerPanel itself handles its visibility or is null */}
        {projectExplorerPanel || <div />} {/* Default to an empty div if null to satisfy SplitPane */}

        <SplitPane split="vertical" minSize={200} defaultSize={500} primary="second" style={{height: '100%'}}>
          {editorPanel}
          {previewPanel}
        </SplitPane>
      </SplitPane>

      {/* Render bottom panels if they are enabled and passed */}
      {showAccessibilityPanel && accessibilityPanel}
      {showTerminal && terminalPanel}
    </div>
  );
};

export default WorkspaceLayout;
