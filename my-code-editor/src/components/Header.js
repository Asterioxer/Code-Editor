import React from 'react';

const Header = (props) => {
  const {
    theme,
    showProjectExplorer,
    showTerminal,
    showAccessibilityPanel,
    accessibilityIssuesCount,
    onToggleProjectExplorer,
    onToggleTheme,
    onToggleTerminal,
    onToggleAccessibilityPanel,
    onToggleZenMode,
    onTriggerImport, // Renamed to be more generic
    onExportProject,
  } = props;

  return (
    <div className="header">
      <button onClick={onToggleProjectExplorer}>
        {showProjectExplorer ? 'Hide Explorer' : 'Show Explorer'}
      </button>
      <button onClick={onToggleTheme}>
        {theme === 'vs-dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
      <button onClick={onToggleTerminal}>
        {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
      </button>
      <button onClick={onToggleAccessibilityPanel} style={{ marginLeft: '10px' }}>
        {showAccessibilityPanel ? 'Hide A11y Issues' : `Show A11y Issues (${accessibilityIssuesCount})`}
      </button>
      <button onClick={onToggleZenMode} style={{ marginLeft: '10px' }}>
        Zen Mode
      </button>
      {/* Hidden file input remains in App.js, button here triggers it via prop */}
      <button onClick={onTriggerImport} style={{ marginLeft: '10px' }}>
        Import Project (.zip)
      </button>
      <button onClick={onExportProject} style={{ marginLeft: '10px' }}>
        Export Project (.zip)
      </button>
    </div>
  );
};

export default Header;
