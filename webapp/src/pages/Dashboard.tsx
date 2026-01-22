import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { colors, typography } from '../shared/constants';
import { API_URL } from '../shared/constants';
import { FixableLink, User } from '../shared/types';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: white;
`;

const LogoIcon = styled.span`
  font-size: 24px;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`;

const UserName = styled.span`
  color: white;
  font-size: 14px;
`;

const SignInButton = styled.a`
  padding: 8px 16px;
  background: ${colors.primary};
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background: ${colors.primaryHover};
  }
`;

const Main = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const PageSubtitle = styled.p`
  color: ${colors.textMuted};
  font-size: 14px;
  margin-bottom: 32px;
`;

const CreateSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
`;

const CreateTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: ${typography.fontFamily};
  
  &::placeholder {
    color: ${colors.textMuted};
  }
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  background: ${colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${colors.primaryHover};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinksSection = styled.div``;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: white;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`;

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  color: ${colors.textMuted};
  font-size: 14px;
`;

const LinksGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const LinkCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LinkTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
`;

const LinkUrl = styled.p`
  font-size: 12px;
  color: ${colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LinkMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
`;

const LinkMetaItem = styled.span`
  font-size: 11px;
  color: ${colors.textMuted};
`;

const LinkActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
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

const OpenButton = styled(ActionButton)`
  background: ${colors.primary};
  
  &:hover {
    background: ${colors.primaryHover};
  }
`;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<FixableLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchLinks();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/links`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (err) {
      console.error('Failed to fetch links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!url.trim()) return;

    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUrl: validUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setLinks([data, ...links]);
        setUrl('');
      }
    } catch (err) {
      console.error('Failed to create link:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (shortCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/f/${shortCode}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <PageContainer>
      <Header>
        <Logo href="/">
          <LogoIcon>🔧</LogoIcon>
          plsfix
        </Logo>
        <UserSection>
          {user ? (
            <>
              {user.avatarUrl && <UserAvatar src={user.avatarUrl} alt={user.name} />}
              <UserName>{user.name || user.username}</UserName>
            </>
          ) : (
            <SignInButton href={`${API_URL}/auth/github`}>
              Sign in with GitHub
            </SignInButton>
          )}
        </UserSection>
      </Header>

      <Main>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>Create and manage your fixable links</PageSubtitle>

        <CreateSection>
          <CreateTitle>Create New Fixable Link</CreateTitle>
          <InputGroup>
            <Input
              type="url"
              placeholder="Enter a URL to make editable..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </InputGroup>
        </CreateSection>

        <LinksSection>
          <SectionHeader>
            <SectionTitle>Your Links</SectionTitle>
          </SectionHeader>

          {loading ? (
            <EmptyState>
              <EmptyText>Loading...</EmptyText>
            </EmptyState>
          ) : links.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🔗</EmptyIcon>
              <EmptyText>
                No fixable links yet. Create your first one above!
              </EmptyText>
            </EmptyState>
          ) : (
            <LinksGrid>
              {links.map((link) => (
                <LinkCard key={link.id}>
                  <LinkInfo>
                    <LinkTitle>{link.title || new URL(link.targetUrl).hostname}</LinkTitle>
                    <LinkUrl>{link.targetUrl}</LinkUrl>
                    <LinkMeta>
                      <LinkMetaItem>Created {formatDate(link.createdAt)}</LinkMetaItem>
                      <LinkMetaItem>{link.viewCount} views</LinkMetaItem>
                    </LinkMeta>
                  </LinkInfo>
                  <LinkActions>
                    <ActionButton onClick={() => handleCopyLink(link.shortCode)}>
                      Copy
                    </ActionButton>
                    <OpenButton onClick={() => navigate(`/f/${link.shortCode}`)}>
                      Open
                    </OpenButton>
                  </LinkActions>
                </LinkCard>
              ))}
            </LinksGrid>
          )}
        </LinksSection>
      </Main>
    </PageContainer>
  );
};
