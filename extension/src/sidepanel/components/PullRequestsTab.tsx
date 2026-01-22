import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { colors, spacing, typography, borderRadius } from '../../shared/constants';
import { useStore } from '../stores/StoreContext';
import { GitHubIcon, GlobeIcon, BranchIcon, LoadingSpinner } from './icons';
import { formatRelativeTime } from '../../shared/utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const HeaderTitle = styled.h3`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  color: ${colors.primaryText};
`;

const PRList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const PRItem = styled.div`
  padding: ${spacing.lg};
  border-bottom: 1px solid ${colors.border};

  &:hover {
    background: ${colors.backgroundSecondary};
  }
`;

const PRHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${spacing.sm};
`;

const PRTitle = styled.h4`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.primaryText};
  margin: 0;
`;

const PRTimestamp = styled.span`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
  white-space: nowrap;
`;

const PRMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  margin-bottom: ${spacing.md};
`;

const PRMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
`;

const PRMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};

  svg {
    flex-shrink: 0;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${borderRadius.full};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  background: ${(props) => {
    switch (props.$status) {
      case 'open':
        return colors.statusOpen + '20';
      case 'merged':
        return colors.statusMerged + '20';
      case 'closed':
        return colors.statusClosed + '20';
      default:
        return colors.backgroundHover;
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'open':
        return colors.statusOpen;
      case 'merged':
        return colors.statusMerged;
      case 'closed':
        return colors.statusClosed;
      default:
        return colors.secondaryText;
    }
  }};
`;

const ChangesBadge = styled.span`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  background: ${colors.backgroundSecondary};
  border-radius: ${borderRadius.md};
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
`;

const ViewPRButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.sm};
  width: 100%;
  padding: ${spacing.md};
  border: none;
  border-radius: ${borderRadius.md};
  background: ${colors.primaryText};
  color: white;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xxl};
  text-align: center;
  color: ${colors.secondaryText};
`;

const EmptyStateText = styled.p`
  font-size: ${typography.sizes.base};
  margin-top: ${spacing.md};
`;

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'creating':
      return 'Creating...';
    case 'processing':
      return 'Processing changes';
    case 'analyzing':
      return 'Analyzing code';
    case 'open':
      return 'Open';
    case 'closed':
      return 'Closed';
    case 'merged':
      return 'Merged';
    default:
      return status;
  }
};

const isLoadingStatus = (status: string): boolean => {
  return ['creating', 'processing', 'analyzing'].includes(status);
};

export const PullRequestsTab: React.FC = observer(() => {
  const store = useStore();
  const pullRequests = store.pullRequests;

  return (
    <Container>
      <Header>
        <HeaderTitle>Pull requests</HeaderTitle>
      </Header>

      <PRList>
        {pullRequests.length > 0 ? (
          pullRequests.map((pr) => (
            <PRItem key={pr.id}>
              <PRHeader>
                <PRTitle>
                  {pr.status === 'open' ? `PR #${pr.number}` : 'New pull request'}
                </PRTitle>
                <PRTimestamp>{formatRelativeTime(pr.createdAt)}</PRTimestamp>
              </PRHeader>

              <PRMeta>
                <PRMetaRow>
                  <PRMetaItem>
                    <GitHubIcon size={14} />
                    {pr.repo}
                  </PRMetaItem>
                  {pr.status === 'open' && (
                    <StatusBadge $status={pr.status}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                        <circle cx="4" cy="4" r="4" />
                      </svg>
                      {getStatusLabel(pr.status)}
                    </StatusBadge>
                  )}
                </PRMetaRow>
                <PRMetaRow>
                  <PRMetaItem>
                    <BranchIcon size={14} />
                    {pr.branch}
                  </PRMetaItem>
                </PRMetaRow>
                <PRMetaRow>
                  <PRMetaItem>
                    <GlobeIcon size={14} />
                    {new URL(pr.websiteUrl || 'https://example.com').hostname}
                  </PRMetaItem>
                  <ChangesBadge>{pr.changesCount} changes</ChangesBadge>
                </PRMetaRow>
              </PRMeta>

              {isLoadingStatus(pr.status) ? (
                <LoadingRow>
                  <LoadingSpinner size={14} />
                  {getStatusLabel(pr.status)}
                </LoadingRow>
              ) : (
                <ViewPRButton href={pr.url} target="_blank" rel="noopener noreferrer">
                  <GitHubIcon size={16} color="white" />
                  View PR #{pr.number}
                </ViewPRButton>
              )}
            </PRItem>
          ))
        ) : (
          <EmptyState>
            <GitHubIcon size={48} color={colors.secondaryText} />
            <EmptyStateText>
              No pull requests yet. Make some changes and create a PR to see it here.
            </EmptyStateText>
          </EmptyState>
        )}
      </PRList>
    </Container>
  );
});
