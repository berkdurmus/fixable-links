import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { colors, spacing, typography } from '../../shared/constants';
import { useStore } from '../stores/StoreContext';
import { GitHubIcon } from './icons';
import { TabType } from '../../shared/types';

const TabContainer = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${colors.border};
  padding: 0 ${spacing.lg};
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  padding: ${spacing.md} ${spacing.md};
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  color: ${(props) => (props.$active ? colors.primaryText : colors.secondaryText)};
  border-bottom: 2px solid ${(props) => (props.$active ? colors.primaryText : 'transparent')};
  margin-bottom: -1px;
  transition: all 0.15s ease;

  &:hover {
    color: ${colors.primaryText};
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background-color: ${colors.backgroundHover};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${colors.secondaryText};
`;

const GitHubBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: #F59E0B;
  color: white;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const AIBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 9px;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  color: white;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AITab = styled(Tab)<{ $active: boolean }>`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)' 
    : 'transparent'};
  border-bottom-color: ${props => props.$active ? '#8B5CF6' : 'transparent'};
  
  &:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  }
`;

const ScoreBadge = styled.span<{ $score: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.bold};
  background: ${props => {
    if (props.$score >= 80) return '#10B981';
    if (props.$score >= 60) return '#F59E0B';
    return '#EF4444';
  }};
  color: white;
`;

export const TabNavigation: React.FC = observer(() => {
  const store = useStore();
  const { activeTab } = store.ui;

  const handleTabChange = (tab: TabType) => {
    store.ui.setActiveTab(tab);
  };

  return (
    <TabContainer>
      <Tab $active={activeTab === 'design'} onClick={() => handleTabChange('design')}>
        Design
      </Tab>
      <Tab $active={activeTab === 'changes'} onClick={() => handleTabChange('changes')}>
        Changes
        {store.changesCount > 0 && <Badge>{store.changesCount}</Badge>}
      </Tab>
      <Tab $active={activeTab === 'pullRequests'} onClick={() => handleTabChange('pullRequests')}>
        <GitHubIcon size={14} />
        Pull requests
        <GitHubBadge>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="4" />
          </svg>
        </GitHubBadge>
      </Tab>
      <AITab $active={activeTab === 'aiComments'} onClick={() => handleTabChange('aiComments')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        AI
        {store.hasAIComments ? (
          <ScoreBadge $score={store.averagePRScore}>{store.averagePRScore}</ScoreBadge>
        ) : (
          <AIBadge>New</AIBadge>
        )}
      </AITab>
    </TabContainer>
  );
});
