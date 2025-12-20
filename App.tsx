
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PromptVault from './components/PromptVault';
import PromptTools from './components/PromptTools';
import Settings from './components/Settings';
import { ToolType } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<string>('dashboard');

  const renderView = () => {
    if (activeView === 'dashboard') {
      return <Dashboard onNavigate={setActiveView} />;
    }
    if (activeView === 'vault') {
      return <PromptVault />;
    }
    if (activeView === 'tools' || activeView.startsWith('tool-')) {
      const toolType = activeView.startsWith('tool-') 
        ? activeView.split('-')[1] as ToolType 
        : 'rephrase';
      return <PromptTools initialTool={toolType} />;
    }
    if (activeView === 'settings') {
      return <Settings />;
    }
    return <Dashboard onNavigate={setActiveView} />;
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;
