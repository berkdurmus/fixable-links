import React, { useEffect } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { DesignTab } from './components/DesignTab';
import { ChangesTab } from './components/ChangesTab';
import { PullRequestsTab } from './components/PullRequestsTab';
import { AICommentsTab } from './components/AICommentsTab';
import { StoreProvider, useStore } from './stores/StoreContext';
import { colors } from '../shared/constants';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${colors.background};
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

const AppContent: React.FC = observer(() => {
  const store = useStore();
  const { activeTab } = store.ui;

  useEffect(() => {
    // Notify background that side panel is ready
    chrome.runtime.sendMessage({ type: 'SIDEPANEL_READY' });

    // Listen for messages from content script (via background)
    const handleMessage = (message: { type: string; payload?: unknown }) => {
      console.log('Sidepanel received message:', message.type, message.payload);
      switch (message.type) {
        case 'ELEMENT_SELECTED':
          const elementPayload = message.payload as { element: unknown };
          if (elementPayload?.element) {
            store.setSelectedElement(elementPayload.element as never);
          }
          break;
        case 'ELEMENT_DESELECTED':
          store.clearSelectedElement();
          break;
        case 'CHANGE_RECORDED':
          const changePayload = message.payload as { change: unknown };
          if (changePayload?.change) {
            store.addChange(changePayload.change as never);
          }
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [store]);

  const renderTab = () => {
    switch (activeTab) {
      case 'design':
        return <DesignTab />;
      case 'changes':
        return <ChangesTab />;
      case 'pullRequests':
        return <PullRequestsTab />;
      case 'aiComments':
        return <AICommentsTab />;
      default:
        return <DesignTab />;
    }
  };

  return (
    <AppContainer>
      <Header />
      <TabNavigation />
      <TabContent>{renderTab()}</TabContent>
    </AppContainer>
  );
});

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
