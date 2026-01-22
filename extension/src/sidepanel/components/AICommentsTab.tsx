import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { colors, spacing, typography, borderRadius } from '../../shared/constants';
import { useStore } from '../stores/StoreContext';
import { LoadingSpinner } from './icons';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const HeaderTitle = styled.h3`
  font-size: ${typography.sizes.md};
  font-weight: ${typography.weights.semibold};
  color: ${colors.primaryText};
  margin: 0 0 ${spacing.sm} 0;
`;

const HeaderSubtitle = styled.p`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
  margin: 0;
`;

const AnalyzeButton = styled.button<{ $analyzing?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.sm};
  width: 100%;
  padding: ${spacing.md};
  margin-top: ${spacing.md};
  border: none;
  border-radius: ${borderRadius.md};
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  color: white;
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  cursor: ${props => props.$analyzing ? 'wait' : 'pointer'};
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${spacing.md};
`;

const ProgressBar = styled.div`
  padding: ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${spacing.sm};
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${colors.backgroundHover};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress * 100}%;
  background: linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ResultCard = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: ${borderRadius.lg};
  margin-bottom: ${spacing.md};
  overflow: hidden;
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md};
  background: ${colors.backgroundSecondary};
  border-bottom: 1px solid ${colors.border};
`;

const ScoreBadge = styled.div<{ $score: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${borderRadius.lg};
  background: ${props => {
    if (props.$score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (props.$score >= 60) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }};
  color: white;
  font-size: ${typography.sizes.lg};
  font-weight: ${typography.weights.bold};
  box-shadow: 0 2px 8px ${props => {
    if (props.$score >= 80) return 'rgba(16, 185, 129, 0.3)';
    if (props.$score >= 60) return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  }};
`;

const ResultInfo = styled.div`
  flex: 1;
  margin-left: ${spacing.md};
`;

const ResultTitle = styled.h4`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.primaryText};
  margin: 0;
`;

const ResultMeta = styled.p`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
  margin: ${spacing.xs} 0 0 0;
`;

const ConfidenceBadge = styled.span<{ $confidence: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${borderRadius.full};
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  background: ${props => props.$confidence >= 0.7 ? colors.backgroundHover : '#FEF3C7'};
  color: ${props => props.$confidence >= 0.7 ? colors.secondaryText : '#92400E'};
`;

const ResultBody = styled.div`
  padding: ${spacing.md};
`;

const Section = styled.div`
  margin-bottom: ${spacing.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h5`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${colors.primaryText};
  margin: 0 0 ${spacing.sm} 0;
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const ScoreBreakdown = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing.sm};
`;

const ScoreItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${spacing.sm};
  background: ${colors.backgroundSecondary};
  border-radius: ${borderRadius.sm};
`;

const ScoreLabel = styled.span`
  font-size: ${typography.sizes.xs};
  color: ${colors.secondaryText};
  margin-bottom: 2px;
`;

const ScoreValue = styled.span<{ $value: number; $inverted?: boolean }>`
  font-size: ${typography.sizes.md};
  font-weight: ${typography.weights.semibold};
  color: ${props => {
    const effectiveValue = props.$inverted ? 100 - props.$value : props.$value;
    if (effectiveValue >= 70) return colors.statusOpen;
    if (effectiveValue >= 50) return '#F59E0B';
    return colors.statusClosed;
  }};
`;

const RiskItem = styled.div<{ $severity: string }>`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm};
  padding: ${spacing.sm};
  background: ${props => {
    switch (props.$severity) {
      case 'critical': return '#FEE2E2';
      case 'high': return '#FEF3C7';
      case 'medium': return '#FEF9C3';
      default: return colors.backgroundSecondary;
    }
  }};
  border-radius: ${borderRadius.sm};
  margin-bottom: ${spacing.xs};
  border-left: 3px solid ${props => {
    switch (props.$severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#EAB308';
      default: return colors.border;
    }
  }};
`;

const RiskIcon = styled.div<{ $severity: string }>`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${props => {
    switch (props.$severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#EAB308';
      default: return colors.secondaryText;
    }
  }};
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

const RiskContent = styled.div`
  flex: 1;
`;

const RiskTitle = styled.div`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  color: ${colors.primaryText};
`;

const RiskDescription = styled.div`
  font-size: ${typography.sizes.xs};
  color: ${colors.secondaryText};
  margin-top: 2px;
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm};
  padding: ${spacing.sm};
  background: #EEF2FF;
  border-radius: ${borderRadius.sm};
  margin-bottom: ${spacing.xs};
  border-left: 3px solid #6366F1;
`;

const FlagItem = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.sm};
  font-size: ${typography.sizes.sm};
  background: ${props => {
    switch (props.$type) {
      case 'warning': return '#FEF3C7';
      case 'info': return '#DBEAFE';
      default: return colors.backgroundSecondary;
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'warning': return '#92400E';
      case 'info': return '#1E40AF';
      default: return colors.secondaryText;
    }
  }};
  margin-bottom: ${spacing.xs};
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

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${spacing.md};
  
  svg {
    width: 32px;
    height: 32px;
    color: white;
  }
`;

const EmptyStateText = styled.p`
  font-size: ${typography.sizes.base};
  margin: 0;
`;

// AI Icon component
const AIIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export const AICommentsTab: React.FC = observer(() => {
  const store = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const aiComments = store.aiComments;
  const hasChanges = store.hasChanges;

  const handleAnalyze = async () => {
    console.log('=== handleAnalyze called ===');
    console.log('hasChanges:', hasChanges, 'isAnalyzing:', isAnalyzing);
    
    if (!hasChanges || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    store.clearAIComments();

    try {
      const changes = store.changes.map(c => ({
        id: c.id,
        type: c.type,
        elementTag: c.elementTag,
        xpath: c.xpath,
        selector: c.selector,
        original: c.original,
        modified: c.modified,
      }));

      const context = {
        pageUrl: store.currentWebsiteUrl || window.location.href,
        viewportWidth: window.innerWidth,
      };

      console.log('Sending request with changes:', changes);
      console.log('Context:', context);

      // Call the API
      const response = await fetch('http://localhost:3001/api/ai-comments/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changes, context }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to analyze changes');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                
                if (event.type === 'progress' || event.type === 'result') {
                  setProgress(event.progress || 0);
                }
                
                if (event.type === 'result' && event.result) {
                  store.addAIComment(event.result);
                }
                
                if (event.type === 'error') {
                  console.error('Analysis error:', event.error);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setIsAnalyzing(false);
      setProgress(1);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Needs Review';
    return 'Concerning';
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>AI Code Review</HeaderTitle>
        <HeaderSubtitle>
          Get intelligent feedback on your changes before creating a PR
        </HeaderSubtitle>
        <AnalyzeButton 
          onClick={handleAnalyze} 
          disabled={!hasChanges || isAnalyzing}
          $analyzing={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner size={18} />
              Analyzing...
            </>
          ) : (
            <>
              <AIIcon />
              Analyze {store.changesCount} Change{store.changesCount !== 1 ? 's' : ''}
            </>
          )}
        </AnalyzeButton>
      </Header>

      {isAnalyzing && (
        <ProgressBar>
          <ProgressLabel>
            <span>Analyzing changes...</span>
            <span>{Math.round(progress * 100)}%</span>
          </ProgressLabel>
          <ProgressTrack>
            <ProgressFill $progress={progress} />
          </ProgressTrack>
        </ProgressBar>
      )}

      <ResultsContainer>
        {aiComments.length > 0 ? (
          aiComments.map((comment) => (
            <ResultCard key={comment.id}>
              <ResultHeader>
                <ScoreBadge $score={comment.prScore.overall}>
                  {comment.prScore.overall}
                </ScoreBadge>
                <ResultInfo>
                  <ResultTitle>{getScoreLabel(comment.prScore.overall)} Change</ResultTitle>
                  <ResultMeta>
                    {comment.prScore.summary}
                  </ResultMeta>
                </ResultInfo>
                <ConfidenceBadge $confidence={comment.confidence}>
                  {Math.round(comment.confidence * 100)}% confident
                </ConfidenceBadge>
              </ResultHeader>
              
              <ResultBody>
                {/* Score Breakdown */}
                <Section>
                  <SectionTitle>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    Score Breakdown
                  </SectionTitle>
                  <ScoreBreakdown>
                    <ScoreItem>
                      <ScoreLabel>Code Consistency</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.codeConsistency}>
                        {comment.prScore.breakdown.codeConsistency}
                      </ScoreValue>
                    </ScoreItem>
                    <ScoreItem>
                      <ScoreLabel>Reuse Score</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.reuseScore}>
                        {comment.prScore.breakdown.reuseScore}
                      </ScoreValue>
                    </ScoreItem>
                    <ScoreItem>
                      <ScoreLabel>AI Detection Risk</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.aiDetectionRisk} $inverted>
                        {comment.prScore.breakdown.aiDetectionRisk}
                      </ScoreValue>
                    </ScoreItem>
                    <ScoreItem>
                      <ScoreLabel>Cascade Risk</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.cascadeRisk} $inverted>
                        {comment.prScore.breakdown.cascadeRisk}
                      </ScoreValue>
                    </ScoreItem>
                    <ScoreItem>
                      <ScoreLabel>Responsive</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.responsiveScore}>
                        {comment.prScore.breakdown.responsiveScore}
                      </ScoreValue>
                    </ScoreItem>
                    <ScoreItem>
                      <ScoreLabel>Intent Match</ScoreLabel>
                      <ScoreValue $value={comment.prScore.breakdown.intentAlignment}>
                        {comment.prScore.breakdown.intentAlignment}
                      </ScoreValue>
                    </ScoreItem>
                  </ScoreBreakdown>
                </Section>

                {/* Flags */}
                {comment.prScore.flags.length > 0 && (
                  <Section>
                    <SectionTitle>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
                      </svg>
                      Flags
                    </SectionTitle>
                    {comment.prScore.flags.map((flag, idx) => (
                      <FlagItem key={idx} $type={flag.type}>
                        {flag.type === 'warning' ? '⚠️' : 'ℹ️'} {flag.message}
                      </FlagItem>
                    ))}
                  </Section>
                )}

                {/* Risks */}
                {comment.risks.length > 0 && (
                  <Section>
                    <SectionTitle>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Risks ({comment.risks.length})
                    </SectionTitle>
                    {comment.risks.slice(0, 3).map((risk) => (
                      <RiskItem key={risk.id} $severity={risk.severity}>
                        <RiskIcon $severity={risk.severity}>!</RiskIcon>
                        <RiskContent>
                          <RiskTitle>{risk.title}</RiskTitle>
                          <RiskDescription>{risk.description}</RiskDescription>
                        </RiskContent>
                      </RiskItem>
                    ))}
                  </Section>
                )}

                {/* Suggestions */}
                {comment.suggestions.length > 0 && (
                  <Section>
                    <SectionTitle>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Suggestions ({comment.suggestions.length})
                    </SectionTitle>
                    {comment.suggestions.slice(0, 2).map((suggestion) => (
                      <SuggestionItem key={suggestion.id}>
                        <div style={{ flex: 1 }}>
                          <RiskTitle>{suggestion.title}</RiskTitle>
                          <RiskDescription>{suggestion.description}</RiskDescription>
                        </div>
                      </SuggestionItem>
                    ))}
                  </Section>
                )}
              </ResultBody>
            </ResultCard>
          ))
        ) : (
          <EmptyState>
            <EmptyStateIcon>
              <AIIcon />
            </EmptyStateIcon>
            <EmptyStateText>
              {hasChanges 
                ? 'Click "Analyze" to get AI-powered feedback on your changes'
                : 'Make some changes to get AI-powered code review feedback'}
            </EmptyStateText>
          </EmptyState>
        )}
      </ResultsContainer>
    </Container>
  );
});
