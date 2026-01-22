/**
 * PlsFix Sidepanel - Injected into proxied pages
 * This renders the editing panel on the right side of the page.
 */

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import styled from 'styled-components';
import { colors, PANEL_WIDTH, typography } from '../shared/constants';
import { ElementInfo, Change, PlsFixMessage } from '../shared/types';

// Panel container
const PanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: ${PANEL_WIDTH}px;
  height: 100vh;
  background: ${colors.panelBackground};
  border-left: 1px solid ${colors.panelBorder};
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  font-family: ${typography.fontFamily};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.background};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${colors.textPrimary};
`;

const LogoIcon = styled.span`
  font-size: 20px;
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.textSecondary};
  transition: all 0.15s ease;
  
  &:hover {
    background: ${colors.surface};
    color: ${colors.textPrimary};
  }
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.background};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.$active ? colors.textPrimary : colors.textSecondary};
  border-bottom: 2px solid ${props => props.$active ? colors.primary : 'transparent'};
  transition: all 0.15s ease;
  
  &:hover {
    color: ${colors.textPrimary};
    background: ${colors.surface};
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${colors.textMuted};
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const PropertyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PropertyLabel = styled.label`
  font-size: 11px;
  color: ${colors.textSecondary};
`;

const PropertyInput = styled.input`
  padding: 6px 8px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 12px;
  color: ${colors.textPrimary};
  background: ${colors.background};
  
  &:focus {
    outline: none;
    border-color: ${colors.selection};
    box-shadow: 0 0 0 2px ${colors.selectionLight};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 12px;
  color: ${colors.textPrimary};
  background: ${colors.background};
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${colors.selection};
    box-shadow: 0 0 0 2px ${colors.selectionLight};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 13px;
  line-height: 1.5;
`;

const ChangeItem = styled.div`
  padding: 12px;
  background: ${colors.surface};
  border-radius: 8px;
  margin-bottom: 8px;
`;

const ChangeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ChangeType = styled.span<{ $type: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => props.$type === 'text' ? colors.primaryLight : colors.selectionLight};
  color: ${props => props.$type === 'text' ? colors.primary : colors.selection};
`;

const ChangeElement = styled.span`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-family: monospace;
`;

const ChangePreview = styled.div`
  font-size: 12px;
  color: ${colors.textPrimary};
  
  del {
    color: ${colors.error};
    text-decoration: line-through;
  }
  
  ins {
    color: ${colors.success};
    text-decoration: none;
  }
`;

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  top: 50%;
  right: ${props => props.$isOpen ? `${PANEL_WIDTH}px` : '0'};
  transform: translateY(-50%);
  width: 36px;
  height: 72px;
  background: ${colors.primary};
  border-radius: 8px 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  z-index: 2147483647;
  transition: all 0.3s ease;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: ${colors.primaryHover};
  }
`;

// Panel component
interface PanelProps {
  config: {
    shortCode: string;
    apiUrl: string;
    webappUrl: string;
  };
}

type TabType = 'design' | 'changes' | 'pr' | 'ai';

const Panel: React.FC<PanelProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('design');
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [textValue, setTextValue] = useState('');

  // Listen for messages from content script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as PlsFixMessage;
      if (!message?.type || message.source !== 'plsfix-content') return;

      switch (message.type) {
        case 'ELEMENT_SELECTED': {
          const { element } = message.payload as { element: ElementInfo };
          setSelectedElement(element);
          setTextValue(element.textContent);
          break;
        }
        case 'ELEMENT_DESELECTED':
          setSelectedElement(null);
          setTextValue('');
          break;
        case 'CHANGE_RECORDED': {
          const { change } = message.payload as { change: Change };
          setChanges(prev => {
            // Update existing or add new
            const existing = prev.findIndex(c => c.elementId === change.elementId && c.type === change.type);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = { ...change, original: prev[existing].original };
              return updated;
            }
            return [...prev, change];
          });
          break;
        }
        case 'PLSFIX_READY':
          console.log('[PlsFix Panel] Content script ready');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send message to content script
  const sendMessage = useCallback((type: string, payload: unknown) => {
    const message: PlsFixMessage = {
      type: type as PlsFixMessage['type'],
      source: 'plsfix-panel',
      payload,
    };
    window.postMessage(message, '*');
  }, []);

  // Apply text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextValue(newText);
    
    if (selectedElement) {
      sendMessage('APPLY_TEXT', {
        elementId: selectedElement.id,
        text: newText,
      });
    }
  }, [selectedElement, sendMessage]);

  // Apply style change
  const handleStyleChange = useCallback((property: string, value: string) => {
    if (selectedElement) {
      sendMessage('APPLY_STYLE', {
        elementId: selectedElement.id,
        styles: { [property]: value },
      });
    }
  }, [selectedElement, sendMessage]);

  const renderDesignTab = () => {
    if (!selectedElement) {
      return (
        <EmptyState>
          <EmptyIcon>👆</EmptyIcon>
          <EmptyText>
            Click on any element on the page to select it and start editing
          </EmptyText>
        </EmptyState>
      );
    }

    return (
      <>
        <Section>
          <SectionTitle>Selected Element</SectionTitle>
          <ChangeElement>&lt;{selectedElement.tagName}&gt;</ChangeElement>
        </Section>

        <Section>
          <SectionTitle>Text</SectionTitle>
          <TextArea
            value={textValue}
            onChange={handleTextChange}
            placeholder="Edit text content..."
          />
        </Section>

        <Section>
          <SectionTitle>Typography</SectionTitle>
          <PropertyGrid>
            <PropertyItem>
              <PropertyLabel>Font Size</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.fontSize}
                onBlur={(e) => handleStyleChange('fontSize', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Font Weight</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.fontWeight}
                onBlur={(e) => handleStyleChange('fontWeight', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Color</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.color}
                onBlur={(e) => handleStyleChange('color', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Text Align</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.textAlign}
                onBlur={(e) => handleStyleChange('textAlign', e.target.value)}
              />
            </PropertyItem>
          </PropertyGrid>
        </Section>

        <Section>
          <SectionTitle>Spacing</SectionTitle>
          <PropertyGrid>
            <PropertyItem>
              <PropertyLabel>Padding Top</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.paddingTop}
                onBlur={(e) => handleStyleChange('paddingTop', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Padding Bottom</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.paddingBottom}
                onBlur={(e) => handleStyleChange('paddingBottom', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Padding Left</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.paddingLeft}
                onBlur={(e) => handleStyleChange('paddingLeft', e.target.value)}
              />
            </PropertyItem>
            <PropertyItem>
              <PropertyLabel>Padding Right</PropertyLabel>
              <PropertyInput
                type="text"
                defaultValue={selectedElement.computedStyles.paddingRight}
                onBlur={(e) => handleStyleChange('paddingRight', e.target.value)}
              />
            </PropertyItem>
          </PropertyGrid>
        </Section>
      </>
    );
  };

  const renderChangesTab = () => {
    if (changes.length === 0) {
      return (
        <EmptyState>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyText>
            No changes yet. Start editing elements to see your changes here.
          </EmptyText>
        </EmptyState>
      );
    }

    return (
      <>
        {changes.map((change) => (
          <ChangeItem key={change.id}>
            <ChangeHeader>
              <ChangeType $type={change.type}>{change.type}</ChangeType>
              <ChangeElement>&lt;{change.elementTag}&gt;</ChangeElement>
            </ChangeHeader>
            <ChangePreview>
              {change.type === 'text' ? (
                <>
                  <del>{change.original.textContent}</del>
                  {' → '}
                  <ins>{change.modified.textContent}</ins>
                </>
              ) : (
                Object.entries(change.modified.styles || {}).map(([key, value]) => (
                  <div key={key}>
                    {key}: <ins>{value as string}</ins>
                  </div>
                ))
              )}
            </ChangePreview>
          </ChangeItem>
        ))}
      </>
    );
  };

  const renderPRTab = () => (
    <EmptyState>
      <EmptyIcon>🔗</EmptyIcon>
      <EmptyText>
        Connect a GitHub repository to create pull requests with your changes.
        <br /><br />
        <a href={`${config.webappUrl}/dashboard`} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
          Go to Dashboard →
        </a>
      </EmptyText>
    </EmptyState>
  );

  const renderAITab = () => (
    <EmptyState>
      <EmptyIcon>✨</EmptyIcon>
      <EmptyText>
        AI-powered code review and suggestions coming soon.
      </EmptyText>
    </EmptyState>
  );

  return (
    <>
      <ToggleButton $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '→' : '←'}
      </ToggleButton>
      
      <PanelContainer $isOpen={isOpen}>
        <Header>
          <Logo>
            <LogoIcon>🔧</LogoIcon>
            plsfix
          </Logo>
          <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
        </Header>
        
        <TabNav>
          <Tab $active={activeTab === 'design'} onClick={() => setActiveTab('design')}>
            Design
          </Tab>
          <Tab $active={activeTab === 'changes'} onClick={() => setActiveTab('changes')}>
            Changes {changes.length > 0 && `(${changes.length})`}
          </Tab>
          <Tab $active={activeTab === 'pr'} onClick={() => setActiveTab('pr')}>
            PR
          </Tab>
          <Tab $active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
            AI
          </Tab>
        </TabNav>
        
        <TabContent>
          {activeTab === 'design' && renderDesignTab()}
          {activeTab === 'changes' && renderChangesTab()}
          {activeTab === 'pr' && renderPRTab()}
          {activeTab === 'ai' && renderAITab()}
        </TabContent>
      </PanelContainer>
    </>
  );
};

// Render function to mount the panel
export function renderPanel(config: PanelProps['config']) {
  // Create container
  const container = document.createElement('div');
  container.id = 'plsfix-panel-root';
  document.body.appendChild(container);

  // Create shadow root for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Create a container inside shadow root
  const appContainer = document.createElement('div');
  appContainer.id = 'plsfix-panel-app';
  shadowRoot.appendChild(appContainer);

  // Inject styles into shadow root
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
  `;
  shadowRoot.appendChild(styleSheet);

  // Render React app
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <Panel config={config} />
    </React.StrictMode>
  );

  console.log('[PlsFix Panel] Rendered successfully');
}
