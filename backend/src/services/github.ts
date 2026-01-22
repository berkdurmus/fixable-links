import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  /**
   * Get the authenticated user
   */
  async getUser() {
    const { data } = await this.octokit.users.getAuthenticated();
    return data;
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepos(page = 1, perPage = 100) {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: perPage,
      page,
      visibility: 'all',
    });
    return data;
  }

  /**
   * Get a specific repository
   */
  async getRepo(owner: string, repo: string) {
    const { data } = await this.octokit.repos.get({ owner, repo });
    return data;
  }

  /**
   * List branches for a repository
   */
  async listBranches(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data;
  }

  /**
   * Get a branch reference
   */
  async getBranch(owner: string, repo: string, branch: string) {
    const { data } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });
    return data;
  }

  /**
   * Create a new branch from an existing branch
   */
  async createBranch(owner: string, repo: string, newBranch: string, baseBranch: string) {
    // Get the SHA of the base branch
    const { data: baseBranchData } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch: baseBranch,
    });

    const sha = baseBranchData.commit.sha;

    // Create the new branch
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha,
    });

    return { name: newBranch, sha };
  }

  /**
   * Get file contents from a repository
   */
  async getFileContent(owner: string, repo: string, path: string, branch?: string) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data)) {
        throw new Error('Path is a directory, not a file');
      }

      if (data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
        path: data.path,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update a file in a repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    content: string,
    message: string
  ) {
    // Check if file exists to get its SHA
    const existingFile = await this.getFileContent(owner, repo, path, branch);

    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha: existingFile?.sha,
    });

    return data;
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ) {
    const { data } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
    });

    return data;
  }

  /**
   * Get a pull request
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number) {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state,
      per_page: 100,
    });
    return data;
  }

  /**
   * Get the contents of a directory
   */
  async getDirectoryContents(owner: string, repo: string, path: string, branch?: string) {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (!Array.isArray(data)) {
      throw new Error('Path is not a directory');
    }

    return data;
  }

  /**
   * Search for files in a repository
   */
  async searchFiles(owner: string, repo: string, query: string) {
    const { data } = await this.octokit.search.code({
      q: `${query} repo:${owner}/${repo}`,
      per_page: 100,
    });
    return data;
  }

  /**
   * Create a commit with multiple file changes
   */
  async createCommitWithFiles(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: Array<{ path: string; content: string }>
  ) {
    // Get the current commit SHA
    const { data: branchData } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });
    const currentCommitSha = branchData.commit.sha;

    // Get the tree SHA of the current commit
    const { data: commitData } = await this.octokit.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await this.octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create a new tree
    const { data: newTree } = await this.octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: blobs,
    });

    // Create a new commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    });

    // Update the branch reference
    await this.octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return newCommit;
  }
}
