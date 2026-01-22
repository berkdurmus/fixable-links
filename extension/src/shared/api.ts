import { Repository, Branch, PullRequest, Change } from './types';
import { API_BASE_URL } from './constants';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.loadToken();
  }

  private async loadToken() {
    const result = await chrome.storage.local.get('authToken');
    this.token = result.authToken || null;
  }

  async setToken(token: string) {
    this.token = token;
    await chrome.storage.local.set({ authToken: token });
  }

  async clearToken() {
    this.token = null;
    await chrome.storage.local.remove('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.loadToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getAuthUrl(): Promise<string> {
    return `${this.baseUrl}/auth/github`;
  }

  async getCurrentUser(): Promise<{
    id: string;
    username: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null> {
    try {
      return await this.request('/auth/me');
    } catch {
      return null;
    }
  }

  // Repository endpoints
  async listRepositories(): Promise<Repository[]> {
    return this.request('/api/repos');
  }

  async listBranches(owner: string, repo: string): Promise<Branch[]> {
    return this.request(`/api/repos/${owner}/${repo}/branches`);
  }

  async connectRepository(data: {
    repoId: number;
    repoFullName: string;
    repoName: string;
    defaultBranch: string;
    isPrivate: boolean;
    websiteUrl: string;
  }): Promise<{ id: string }> {
    return this.request('/api/repos/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConnectedRepositories(): Promise<Array<{
    id: string;
    repoId: number;
    repoFullName: string;
    repoName: string;
    defaultBranch: string;
    websiteUrl: string;
  }>> {
    return this.request('/api/repos/connected');
  }

  // Changes endpoints
  async saveChanges(projectId: string, changes: Change[]): Promise<{ count: number }> {
    return this.request('/api/changes', {
      method: 'POST',
      body: JSON.stringify({ projectId, changes }),
    });
  }

  async getChanges(projectId: string): Promise<Change[]> {
    return this.request(`/api/changes/${projectId}`);
  }

  async deleteChange(changeId: string): Promise<void> {
    await this.request(`/api/changes/${changeId}`, {
      method: 'DELETE',
    });
  }

  // Pull Request endpoints
  async createPullRequest(data: {
    projectId: string;
    changes: Change[];
    title?: string;
    description?: string;
    branch?: string;
    baseBranch?: string;
    websiteUrl: string;
  }): Promise<{
    id: string;
    status: string;
    createdAt: string;
  }> {
    return this.request('/api/pull-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listPullRequests(params?: {
    projectId?: string;
    websiteUrl?: string;
  }): Promise<PullRequest[]> {
    const queryParams = new URLSearchParams();
    if (params?.projectId) queryParams.set('projectId', params.projectId);
    if (params?.websiteUrl) queryParams.set('websiteUrl', params.websiteUrl);

    const query = queryParams.toString();
    return this.request(`/api/pull-requests${query ? `?${query}` : ''}`);
  }

  async getPullRequest(prId: string): Promise<PullRequest & {
    changes: Change[];
  }> {
    return this.request(`/api/pull-requests/${prId}`);
  }
}

export const api = new ApiService();
