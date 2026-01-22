import React from 'react';
import styled from 'styled-components';
import { colors, spacing, typography } from '../../shared/constants';
import { PlsfixIcon } from './icons/PlsfixIcon';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.border};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
`;

const LogoText = styled.span`
  font-size: ${typography.sizes.md};
  font-weight: ${typography.weights.semibold};
  color: ${colors.primaryText};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: ${colors.secondaryText};

  &:hover {
    background-color: ${colors.backgroundHover};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <LogoSection>
        <PlsfixIcon size={24} />
        <LogoText>plsfix</LogoText>
      </LogoSection>
      <ActionButtons>
        <IconButton title="Pin panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 17v5M9 12l-3 3 6 2 2 6 3-3" />
            <path d="M17 7l-7 7" />
            <path d="M21 3l-3.5 3.5" />
          </svg>
        </IconButton>
        <IconButton title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </IconButton>
      </ActionButtons>
    </HeaderContainer>
  );
};
