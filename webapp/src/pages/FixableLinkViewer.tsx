import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../shared/constants';
import { API_URL } from '../shared/constants';
import { FixableLink } from '../shared/types';

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: white;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: ${colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: ${colors.textMuted};
  font-size: 14px;
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: white;
  text-align: center;
  padding: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 8px;
`;

const ErrorMessage = styled.p`
  color: ${colors.textMuted};
  font-size: 14px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: ${colors.primary};
  color: white;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${colors.primaryHover};
  }
`;

const ViewerContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
`;

const IframeContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const ProxiedFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 2147483645;
  backdrop-filter: blur(10px);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TopBarLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: white;
`;

const TargetUrl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: ${colors.textMuted};
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TopBarButton = styled.button`
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ContentFrame = styled.div`
  margin-top: 40px;
  height: calc(100vh - 40px);
  width: 100%;
`;

export const FixableLinkViewer: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<FixableLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(true); // Default to proxy for reliability

  useEffect(() => {
    if (!shortCode) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    fetchLink();
  }, [shortCode]);

  const fetchLink = async () => {
    try {
      const response = await fetch(`${API_URL}/api/links/${shortCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This fixable link does not exist');
        } else {
          setError('Failed to load the link');
        }
        return;
      }

      const data = await response.json();
      setLink(data);
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOriginal = () => {
    if (link) {
      window.open(link.targetUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Loading fixable link...</LoadingText>
      </LoadingContainer>
    );
  }

  if (error || !link) {
    return (
      <ErrorContainer>
        <ErrorIcon>😕</ErrorIcon>
        <ErrorTitle>Link Not Found</ErrorTitle>
        <ErrorMessage>{error || 'This fixable link does not exist or has been removed.'}</ErrorMessage>
        <BackButton onClick={() => navigate('/')}>Go to Homepage</BackButton>
      </ErrorContainer>
    );
  }

  // Use proxy URL to load the page with injected scripts
  const proxyUrl = `${API_URL}/proxy/${shortCode}`;

  return (
    <ViewerContainer>
      <TopBar>
        <TopBarLeft>
          <TopBarLogo>
            🔧 plsfix
          </TopBarLogo>
          <TargetUrl title={link.targetUrl}>
            {link.targetUrl}
          </TargetUrl>
        </TopBarLeft>
        <TopBarRight>
          <TopBarButton onClick={handleCopyLink}>
            Copy Link
          </TopBarButton>
          <TopBarButton onClick={handleOpenOriginal}>
            Open Original
          </TopBarButton>
        </TopBarRight>
      </TopBar>

      <ContentFrame>
        <IframeContainer>
          <ProxiedFrame
            src={proxyUrl}
            title={link.title || 'Fixable Link'}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </IframeContainer>
      </ContentFrame>
    </ViewerContainer>
  );
};
