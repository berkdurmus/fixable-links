// Element types
export interface ElementInfo {
  id: string;
  tagName: string;
  xpath: string;
  selector: string;
  textContent: string;
  computedStyles: ComputedStyleInfo;
  boundingRect?: DOMRect;
}

export interface ComputedStyleInfo {
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  backgroundColor: string;
  textAlign: string;
  fontStyle: string;
  textDecoration: string;
  width: string;
  height: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
}

// Change types
export type ChangeType = 'text' | 'style';

export interface Change {
  id: string;
  type: ChangeType;
  elementId: string;
  elementTag: string;
  xpath: string;
  selector: string;
  timestamp: number;
  original: {
    textContent?: string;
    styles?: Partial<ComputedStyleInfo>;
  };
  modified: {
    textContent?: string;
    styles?: Partial<ComputedStyleInfo>;
  };
}

// Message types for postMessage communication
export type MessageType =
  | 'PLSFIX_INIT'
  | 'PLSFIX_READY'
  | 'ELEMENT_SELECTED'
  | 'ELEMENT_HOVERED'
  | 'ELEMENT_DESELECTED'
  | 'CHANGE_RECORDED'
  | 'APPLY_STYLE'
  | 'APPLY_TEXT'
  | 'REVERT_CHANGE'
  | 'TOGGLE_EDIT_MODE'
  | 'TOGGLE_PANEL'
  | 'PANEL_READY';

export interface PlsFixMessage {
  type: MessageType;
  source: 'plsfix-panel' | 'plsfix-content';
  payload?: unknown;
}

export interface ElementSelectedPayload {
  element: ElementInfo;
}

export interface ApplyStylePayload {
  elementId: string;
  styles: Partial<ComputedStyleInfo>;
}

export interface ApplyTextPayload {
  elementId: string;
  text: string;
}

// Fixable Link types
export interface FixableLink {
  id: string;
  shortCode: string;
  targetUrl: string;
  title: string | null;
  description: string | null;
  creatorId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
  settings: Record<string, unknown> | null;
  creator?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  project?: {
    id: string;
    repoFullName: string;
    repoName: string;
    defaultBranch: string;
  };
}

// GitHub/PR types
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

export interface Branch {
  name: string;
  commit: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  status: 'creating' | 'processing' | 'analyzing' | 'open' | 'closed' | 'merged';
  createdAt: number;
  repo: string;
  branch: string;
  websiteUrl: string;
  changesCount: number;
}

// UI State types
export type TabType = 'design' | 'changes' | 'pullRequests' | 'aiComments';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}
