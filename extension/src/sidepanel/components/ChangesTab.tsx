import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { colors, spacing, typography, borderRadius } from '../../shared/constants';
import { useStore } from '../stores/StoreContext';
import { GitHubIcon, BranchIcon, ChevronDownIcon, EyeIcon, UndoIcon, ElementIcon, LoadingSpinner } from './icons';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const RepoSection = styled.div`
  padding: ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const RepoSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
`;

const SelectorButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} ${spacing.md};
  border: 1px solid ${colors.border};
  border-radius: ${borderRadius.md};
  background: ${colors.background};
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};
  cursor: pointer;
  flex: 1;

  &:hover {
    background: ${colors.backgroundHover};
  }

  svg {
    flex-shrink: 0;
  }
`;

const SelectorText = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BranchSelector = styled(SelectorButton)`
  flex: none;
  width: auto;
`;

const CreatePRButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.sm};
  width: 100%;
  padding: ${spacing.md};
  border: none;
  border-radius: ${borderRadius.md};
  background: ${colors.primaryAction};
  color: white;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${colors.primaryActionHover};
  }

  &:disabled {
    background: ${colors.backgroundHover};
    color: ${colors.secondaryText};
    cursor: not-allowed;
  }
`;

const ChangesSection = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChangesSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const ChangesSectionTitle = styled.h3`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  color: ${colors.primaryText};
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${colors.secondaryText};
  cursor: pointer;
  border-radius: ${borderRadius.sm};

  &:hover {
    background: ${colors.backgroundHover};
  }
`;

const ChangesList = styled.div`
  padding: ${spacing.sm} 0;
`;

const ChangeItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${spacing.sm} ${spacing.lg};
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: ${colors.backgroundHover};
  }
`;

const ChangeItemExpander = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: ${colors.secondaryText};
  cursor: pointer;
  margin-right: ${spacing.xs};

  &:hover {
    color: ${colors.primaryText};
  }
`;

const ChangeItemContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ChangeItemTitle = styled.span`
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};
`;

const ChangeItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const ElementBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: ${borderRadius.sm};
  background: ${colors.elementBadge};
  font-size: ${typography.sizes.xs};
  color: ${colors.secondaryText};
`;

const ChangeItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: ${colors.secondaryText};
  cursor: pointer;
  border-radius: ${borderRadius.sm};

  &:hover {
    background: ${colors.backgroundHover};
    color: ${colors.primaryText};
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

const DropdownOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: ${borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 101;
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  width: 100%;
  padding: ${spacing.sm} ${spacing.md};
  border: none;
  background: transparent;
  text-align: left;
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};
  cursor: pointer;

  &:hover {
    background: ${colors.backgroundHover};
  }
`;

export const ChangesTab: React.FC = observer(() => {
  const store = useStore();
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);

  const selectedRepo = store.currentRepo;
  const selectedBranch = store.currentBranch || 'main';

  // Mock data for demo
  const mockRepos = [
    { id: 1, name: 'jam-website', fullName: 'jamdotdev/jam-website', defaultBranch: 'main', private: false },
    { id: 2, name: 'another-repo', fullName: 'user/another-repo', defaultBranch: 'main', private: true },
  ];

  const mockBranches = ['main', 'develop', 'feature/new-feature'];

  const handleCreatePR = async () => {
    setIsCreatingPR(true);
    // Simulate PR creation
    setTimeout(() => {
      const prId = Date.now().toString();
      store.addPullRequest({
        id: prId,
        number: Math.floor(Math.random() * 1000) + 500,
        title: `Update website content`,
        url: `https://github.com/${selectedRepo?.fullName || 'jamdotdev/jam-website'}/pull/${Math.floor(Math.random() * 1000)}`,
        status: 'creating',
        createdAt: Date.now(),
        repo: selectedRepo?.fullName || 'jamdotdev/jam-website',
        branch: selectedBranch,
        websiteUrl: window.location.href,
        changesCount: store.changesCount,
      });
      setIsCreatingPR(false);
      store.ui.setActiveTab('pullRequests');
      
      // Simulate status changes
      setTimeout(() => store.updatePullRequest(prId, { status: 'processing' }), 1000);
      setTimeout(() => store.updatePullRequest(prId, { status: 'analyzing' }), 3000);
      setTimeout(() => store.updatePullRequest(prId, { status: 'open' }), 5000);
    }, 500);
  };

  return (
    <Container>
      <RepoSection>
        <RepoSelector>
          <div style={{ position: 'relative', flex: 1 }}>
            <SelectorButton onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}>
              <GitHubIcon size={16} />
              <SelectorText>
                {selectedRepo?.fullName || 'Select repository'}
              </SelectorText>
              <ChevronDownIcon size={14} />
            </SelectorButton>
            
            {isRepoDropdownOpen && (
              <>
                <DropdownOverlay onClick={() => setIsRepoDropdownOpen(false)} />
                <Dropdown>
                  {mockRepos.map((repo) => (
                    <DropdownItem
                      key={repo.id}
                      onClick={() => {
                        store.setRepositories(mockRepos);
                        store.setCurrentRepo(repo.id);
                        setIsRepoDropdownOpen(false);
                      }}
                    >
                      <GitHubIcon size={14} />
                      {repo.fullName}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <BranchSelector onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}>
              <BranchIcon size={14} />
              {selectedBranch}
              <ChevronDownIcon size={14} />
            </BranchSelector>

            {isBranchDropdownOpen && (
              <>
                <DropdownOverlay onClick={() => setIsBranchDropdownOpen(false)} />
                <Dropdown style={{ minWidth: '120px' }}>
                  {mockBranches.map((branch) => (
                    <DropdownItem
                      key={branch}
                      onClick={() => {
                        store.setCurrentBranch(branch);
                        setIsBranchDropdownOpen(false);
                      }}
                    >
                      <BranchIcon size={14} />
                      {branch}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </>
            )}
          </div>
        </RepoSelector>

        <CreatePRButton 
          onClick={handleCreatePR} 
          disabled={!store.hasChanges || isCreatingPR}
        >
          {isCreatingPR ? (
            <>
              <LoadingSpinner size={16} />
              Creating...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create pull request
            </>
          )}
        </CreatePRButton>
      </RepoSection>

      <ChangesSection>
        <ChangesSectionHeader>
          <ChangesSectionTitle>Changes</ChangesSectionTitle>
          <MoreButton>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </MoreButton>
        </ChangesSectionHeader>

        {store.hasChanges ? (
          <ChangesList>
            {store.changes.map((change) => (
              <ChangeItem key={change.id}>
                <ChangeItemExpander>
                  <ChevronDownIcon size={12} />
                </ChangeItemExpander>
                <ChangeItemContent>
                  <ChangeItemTitle>
                    {change.type === 'text' ? 'text change' : 'style change'}
                  </ChangeItemTitle>
                  <ChangeItemMeta>
                    <ElementBadge>
                      <ElementIcon size={10} tag={change.elementTag} />
                      {change.elementTag}
                    </ElementBadge>
                  </ChangeItemMeta>
                </ChangeItemContent>
                <ChangeItemActions>
                  <ActionButton title="Preview change">
                    <EyeIcon size={14} />
                  </ActionButton>
                  <ActionButton title="Revert change" onClick={() => change.revert()}>
                    <UndoIcon size={14} />
                  </ActionButton>
                </ChangeItemActions>
              </ChangeItem>
            ))}
          </ChangesList>
        ) : (
          <EmptyState>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M12 18v-6M9 15h6" />
            </svg>
            <EmptyStateText>
              No changes yet. Edit elements on the page to see changes here.
            </EmptyStateText>
          </EmptyState>
        )}
      </ChangesSection>
    </Container>
  );
});
