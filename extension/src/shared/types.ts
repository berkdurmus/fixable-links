// Element types
export interface ElementInfo {
  id: string;
  tagName: string;
  xpath: string;
  selector: string;
  textContent: string;
  computedStyles: ComputedStyleInfo;
  boundingRect: DOMRect;
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

// Message types for communication between content script, background, and sidepanel
export type MessageType =
  | 'ELEMENT_SELECTED'
  | 'ELEMENT_HOVERED'
  | 'ELEMENT_DESELECTED'
  | 'CHANGE_RECORDED'
  | 'APPLY_STYLE'
  | 'APPLY_TEXT'
  | 'REVERT_CHANGE'
  | 'GET_CHANGES'
  | 'TOGGLE_EDIT_MODE'
  | 'SIDEPANEL_READY';

export interface Message {
  type: MessageType;
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

// UI State types
export type TabType = 'design' | 'changes' | 'pullRequests' | 'aiComments';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
}
