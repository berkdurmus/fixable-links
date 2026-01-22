import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { colors, spacing, typography, elementTypeLabels, fontFamilies, fontWeights } from '../../shared/constants';
import { useStore } from '../stores/StoreContext';
import { rgbToHex, parseFontSize, parseSpacing, getFontWeightLabel, getFontFamilyLabel, getOpacityFromRgba } from '../../shared/utils';
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  StrikethroughIcon,
  ItalicIcon,
  UnderlineIcon,
  ExpandIcon,
  ChevronDownIcon,
} from './icons';
import { ElementIcon } from './icons';

const Container = styled.div`
  padding: ${spacing.lg};
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

const Section = styled.div`
  margin-bottom: ${spacing.lg};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  color: ${colors.secondaryText};
  text-transform: capitalize;
`;

const ElementTypeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm} 0;
  margin-bottom: ${spacing.md};
  border-bottom: 1px solid ${colors.border};
`;

const ElementTypeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${colors.backgroundHover};
`;

const ElementTypeName = styled.span`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  color: ${colors.primaryText};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
`;

const Select = styled.select`
  flex: 1;
  height: 32px;
  padding: 0 ${spacing.sm};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};
  background-color: ${colors.background};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.selectionBorder};
  }
`;

const SmallSelect = styled(Select)`
  width: 100px;
  flex: none;
`;

const NumberInput = styled.input`
  width: 60px;
  height: 32px;
  padding: 0 ${spacing.sm};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${colors.selectionBorder};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  overflow: hidden;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: ${(props) => (props.$active ? colors.backgroundHover : 'transparent')};
  cursor: pointer;
  color: ${(props) => (props.$active ? colors.primaryText : colors.secondaryText)};
  transition: all 0.15s ease;

  &:hover {
    background: ${colors.backgroundHover};
  }

  &:not(:last-child) {
    border-right: 1px solid ${colors.border};
  }
`;

const ColorInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${(props) => props.$color};
  border: 1px solid ${colors.border};
  cursor: pointer;
`;

const ColorInput = styled.input`
  flex: 1;
  height: 32px;
  padding: 0 ${spacing.sm};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: ${typography.sizes.base};
  font-family: monospace;
  color: ${colors.primaryText};

  &:focus {
    outline: none;
    border-color: ${colors.selectionBorder};
  }
`;

const OpacityInput = styled(NumberInput)`
  width: 50px;
`;

const PercentLabel = styled.span`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
`;

const SizeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
`;

const SizeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const SizeLabel = styled.span`
  font-size: ${typography.sizes.sm};
  color: ${colors.secondaryText};
  width: 16px;
`;

const SizeInput = styled.input`
  width: 70px;
  height: 32px;
  padding: 0 ${spacing.sm};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: ${typography.sizes.base};
  color: ${colors.primaryText};

  &:focus {
    outline: none;
    border-color: ${colors.selectionBorder};
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.sm};
`;

const LayoutGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const LayoutLabel = styled.span`
  font-size: ${typography.sizes.xs};
  color: ${colors.tertiaryText};
  text-transform: uppercase;
`;

const LayoutInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const LayoutIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${colors.tertiaryText};
`;

const LayoutInput = styled.input`
  width: 50px;
  height: 28px;
  padding: 0 ${spacing.xs};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  font-size: ${typography.sizes.sm};
  color: ${colors.primaryText};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${colors.selectionBorder};
  }
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: ${colors.tertiaryText};
  cursor: pointer;

  &:hover {
    color: ${colors.secondaryText};
  }
`;

export const DesignTab: React.FC = observer(() => {
  const store = useStore();
  const element = store.selectedElement;

  if (!element) {
    return (
      <Container>
        <EmptyState>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 15h6" />
          </svg>
          <EmptyStateText>
            Click on any element on the page to select it and edit its properties here.
          </EmptyStateText>
        </EmptyState>
      </Container>
    );
  }

  const styles = element.computedStyles;
  const tagName = element.tagName;
  const elementType = elementTypeLabels[tagName] || tagName;

  const handleStyleChange = (property: string, value: string) => {
    store.applyStyleToElement({ [property]: value });
  };

  return (
    <Container>
      <ElementTypeIndicator>
        <ElementTypeIcon>
          <ElementIcon size={14} tag={tagName.toLowerCase()} color={colors.secondaryText} />
        </ElementTypeIcon>
        <ElementTypeName>{elementType}</ElementTypeName>
      </ElementTypeIndicator>

      {/* Text Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Text</SectionTitle>
        </SectionHeader>

        <Row>
          <Select
            value={styles.fontFamily}
            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
          >
            {fontFamilies.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </Select>
        </Row>

        <Row>
          <SmallSelect
            value={styles.fontWeight}
            onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
          >
            {fontWeights.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </SmallSelect>
          <NumberInput
            type="number"
            value={parseFontSize(styles.fontSize)}
            onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
          />
        </Row>

        <Row>
          <ButtonGroup>
            <IconButton
              $active={styles.textAlign === 'left'}
              onClick={() => handleStyleChange('textAlign', 'left')}
            >
              <AlignLeftIcon size={14} />
            </IconButton>
            <IconButton
              $active={styles.textAlign === 'center'}
              onClick={() => handleStyleChange('textAlign', 'center')}
            >
              <AlignCenterIcon size={14} />
            </IconButton>
            <IconButton
              $active={styles.textAlign === 'right'}
              onClick={() => handleStyleChange('textAlign', 'right')}
            >
              <AlignRightIcon size={14} />
            </IconButton>
          </ButtonGroup>

          <ButtonGroup>
            <IconButton
              $active={styles.textDecoration.includes('line-through')}
              onClick={() =>
                handleStyleChange(
                  'textDecoration',
                  styles.textDecoration.includes('line-through') ? 'none' : 'line-through'
                )
              }
            >
              <StrikethroughIcon size={14} />
            </IconButton>
            <IconButton
              $active={styles.fontStyle === 'italic'}
              onClick={() =>
                handleStyleChange('fontStyle', styles.fontStyle === 'italic' ? 'normal' : 'italic')
              }
            >
              <ItalicIcon size={14} />
            </IconButton>
            <IconButton
              $active={styles.textDecoration.includes('underline')}
              onClick={() =>
                handleStyleChange(
                  'textDecoration',
                  styles.textDecoration.includes('underline') ? 'none' : 'underline'
                )
              }
            >
              <UnderlineIcon size={14} />
            </IconButton>
          </ButtonGroup>
        </Row>

        <ColorInputRow>
          <ColorSwatch $color={styles.color} />
          <ColorInput
            value={rgbToHex(styles.color)}
            onChange={(e) => handleStyleChange('color', e.target.value)}
          />
          <OpacityInput
            type="number"
            min="0"
            max="100"
            value={Math.round(getOpacityFromRgba(styles.color))}
            onChange={(e) => {
              // Keep current color, just update opacity
            }}
          />
          <PercentLabel>%</PercentLabel>
        </ColorInputRow>
      </Section>

      {/* Size Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Size</SectionTitle>
        </SectionHeader>

        <SizeRow>
          <SizeGroup>
            <SizeLabel>W</SizeLabel>
            <SizeInput
              value={parseSpacing(styles.width)}
              onChange={(e) => handleStyleChange('width', `${e.target.value}px`)}
            />
          </SizeGroup>
          <SizeGroup>
            <SizeLabel>H</SizeLabel>
            <SizeInput
              value={parseSpacing(styles.height)}
              onChange={(e) => handleStyleChange('height', `${e.target.value}px`)}
            />
          </SizeGroup>
        </SizeRow>
      </Section>

      {/* Layout Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>Layout</SectionTitle>
        </SectionHeader>

        <LayoutGrid>
          <LayoutGroup>
            <LayoutLabel>Padding</LayoutLabel>
            <LayoutInputRow>
              <LayoutIcon>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.3" />
                </svg>
              </LayoutIcon>
              <LayoutInput
                value={parseSpacing(styles.paddingTop)}
                onChange={(e) => handleStyleChange('paddingTop', `${e.target.value}px`)}
              />
            </LayoutInputRow>
            <LayoutInputRow>
              <LayoutIcon>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.3" />
                </svg>
              </LayoutIcon>
              <LayoutInput
                value={parseSpacing(styles.paddingRight)}
                onChange={(e) => handleStyleChange('paddingRight', `${e.target.value}px`)}
              />
            </LayoutInputRow>
          </LayoutGroup>

          <LayoutGroup>
            <LayoutLabel>&nbsp;</LayoutLabel>
            <LayoutInputRow>
              <LayoutIcon>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.3" />
                </svg>
              </LayoutIcon>
              <LayoutInput
                value={parseSpacing(styles.paddingBottom)}
                onChange={(e) => handleStyleChange('paddingBottom', `${e.target.value}px`)}
              />
              <LinkButton title="Link all values">
                <ExpandIcon size={12} />
              </LinkButton>
            </LayoutInputRow>
            <LayoutInputRow>
              <LayoutIcon>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.3" />
                </svg>
              </LayoutIcon>
              <LayoutInput
                value={parseSpacing(styles.paddingLeft)}
                onChange={(e) => handleStyleChange('paddingLeft', `${e.target.value}px`)}
              />
            </LayoutInputRow>
          </LayoutGroup>
        </LayoutGrid>

        <div style={{ marginTop: spacing.md }}>
          <LayoutGrid>
            <LayoutGroup>
              <LayoutLabel>Margin</LayoutLabel>
              <LayoutInputRow>
                <LayoutIcon>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </LayoutIcon>
                <LayoutInput
                  value={parseSpacing(styles.marginTop)}
                  onChange={(e) => handleStyleChange('marginTop', `${e.target.value}px`)}
                />
              </LayoutInputRow>
              <LayoutInputRow>
                <LayoutIcon>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </LayoutIcon>
                <LayoutInput
                  value={parseSpacing(styles.marginRight)}
                  onChange={(e) => handleStyleChange('marginRight', `${e.target.value}px`)}
                />
              </LayoutInputRow>
            </LayoutGroup>

            <LayoutGroup>
              <LayoutLabel>&nbsp;</LayoutLabel>
              <LayoutInputRow>
                <LayoutIcon>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </LayoutIcon>
                <LayoutInput
                  value={parseSpacing(styles.marginBottom)}
                  onChange={(e) => handleStyleChange('marginBottom', `${e.target.value}px`)}
                />
                <LinkButton title="Link all values">
                  <ExpandIcon size={12} />
                </LinkButton>
              </LayoutInputRow>
              <LayoutInputRow>
                <LayoutIcon>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </LayoutIcon>
                <LayoutInput
                  value={parseSpacing(styles.marginLeft)}
                  onChange={(e) => handleStyleChange('marginLeft', `${e.target.value}px`)}
                />
              </LayoutInputRow>
            </LayoutGroup>
          </LayoutGrid>
        </div>
      </Section>
    </Container>
  );
});
