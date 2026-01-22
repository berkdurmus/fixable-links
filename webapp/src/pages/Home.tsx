import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { colors, typography } from '../shared/constants';
import { API_URL } from '../shared/constants';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: white;
`;

const LogoIcon = styled.span`
  font-size: 28px;
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const NavLink = styled.a`
  color: ${colors.textMuted};
  font-size: 14px;
  transition: color 0.2s ease;
  
  &:hover {
    color: white;
  }
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 56px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  line-height: 1.1;
  
  span {
    background: linear-gradient(135deg, ${colors.primary} 0%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: ${colors.textMuted};
  max-width: 600px;
  margin-bottom: 48px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CreateSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 560px;
`;

const CreateTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-family: ${typography.fontFamily};
  
  &::placeholder {
    color: ${colors.textMuted};
  }
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Button = styled.button`
  padding: 14px 24px;
  background: ${colors.primary};
  color: white;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${colors.error};
  font-size: 13px;
  text-align: left;
  margin-bottom: 12px;
`;

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  padding: 16px;
  text-align: left;
`;

const SuccessTitle = styled.div`
  color: ${colors.primary};
  font-weight: 600;
  margin-bottom: 8px;
`;

const SuccessLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  a {
    color: white;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 6px;
    flex: 1;
    word-break: break-all;
  }
`;

const CopyButton = styled.button`
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 900px;
  margin-top: 64px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  text-align: left;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
`;

const FeatureIcon = styled.div`
  font-size: 24px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
`;

const FeatureDesc = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
  line-height: 1.5;
`;

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState<{ shortCode: string; url: string } | null>(null);

  const handleCreate = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL format
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUrl: validUrl }),
      });

      // Try to parse response as JSON
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Failed to parse response:', text);
        throw new Error('Server error - please make sure the backend is running');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link');
      }

      const fixableUrl = `${window.location.origin}/f/${data.shortCode}`;
      
      setCreatedLink({
        shortCode: data.shortCode,
        url: fixableUrl,
      });
    } catch (err) {
      console.error('Error creating link:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.url);
    }
  };

  const handleOpen = () => {
    if (createdLink) {
      navigate(`/f/${createdLink.shortCode}`);
    }
  };

  return (
    <PageContainer>
      <Header>
        <Logo>
          <LogoIcon>🔧</LogoIcon>
          plsfix
        </Logo>
        <NavLinks>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href={`${API_URL}/auth/github`}>Sign in</NavLink>
        </NavLinks>
      </Header>

      <Main>
        <Badge>
          ✨ No extension required
        </Badge>
        
        <Title>
          Make any webpage <span>editable</span>
        </Title>
        
        <Subtitle>
          Create a fixable link for any webpage. Edit text, styles, and layout visually. 
          Then create a pull request with your changes.
        </Subtitle>

        <CreateSection>
          <CreateTitle>Create a Fixable Link</CreateTitle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {createdLink ? (
            <SuccessMessage>
              <SuccessTitle>Link created successfully!</SuccessTitle>
              <SuccessLink>
                <a href={createdLink.url} target="_blank" rel="noopener noreferrer">
                  {createdLink.url}
                </a>
                <CopyButton onClick={handleCopy}>Copy</CopyButton>
              </SuccessLink>
              <div style={{ marginTop: '12px' }}>
                <Button onClick={handleOpen}>Open Editor →</Button>
              </div>
            </SuccessMessage>
          ) : (
            <InputGroup>
              <Input
                type="url"
                placeholder="Enter any URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Link'}
              </Button>
            </InputGroup>
          )}
        </CreateSection>

        <Features>
          <Feature>
            <FeatureIcon>🎨</FeatureIcon>
            <FeatureTitle>Visual Editing</FeatureTitle>
            <FeatureDesc>
              Click any element to edit. Change text, colors, fonts, and spacing with an intuitive UI.
            </FeatureDesc>
          </Feature>
          <Feature>
            <FeatureIcon>🔗</FeatureIcon>
            <FeatureTitle>Shareable Links</FeatureTitle>
            <FeatureDesc>
              Share fixable links with your team. No extension needed - just open the link and start editing.
            </FeatureDesc>
          </Feature>
          <Feature>
            <FeatureIcon>🚀</FeatureIcon>
            <FeatureTitle>GitHub Integration</FeatureTitle>
            <FeatureDesc>
              Connect your repo and create PRs directly from your edits. Engineers love the clean code.
            </FeatureDesc>
          </Feature>
        </Features>
      </Main>
    </PageContainer>
  );
};
