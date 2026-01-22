import { Router, Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { requireAuth, getUser } from '../middleware/auth';
import { prisma } from '../index';

export const reposRouter = Router();

/**
 * Get user's GitHub repositories
 */
reposRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const octokit = new Octokit({ auth: user.accessToken });

    // Fetch repos from GitHub
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      visibility: 'all',
    });

    // Map to our format
    const mappedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }));

    res.json(mappedRepos);
  } catch (error) {
    console.error('Failed to fetch repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

/**
 * Get branches for a repository
 */
reposRouter.get('/:owner/:repo/branches', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { owner, repo } = req.params;
    const octokit = new Octokit({ auth: user.accessToken });

    const { data: branches } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    const mappedBranches = branches.map((branch) => ({
      name: branch.name,
      commit: branch.commit.sha,
      protected: branch.protected,
    }));

    res.json(mappedBranches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

/**
 * Connect a repository to the current website
 */
reposRouter.post('/connect', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { repoId, repoFullName, repoName, defaultBranch, isPrivate, websiteUrl } = req.body;

    if (!repoId || !repoFullName || !repoName) {
      return res.status(400).json({ error: 'Repository details required' });
    }

    // Create or update project
    const project = await prisma.project.upsert({
      where: {
        userId_repoId: {
          userId: user.id,
          repoId,
        },
      },
      update: {
        websiteUrl,
        defaultBranch: defaultBranch || 'main',
      },
      create: {
        userId: user.id,
        repoId,
        repoFullName,
        repoName,
        defaultBranch: defaultBranch || 'main',
        isPrivate: isPrivate || false,
        websiteUrl,
      },
    });

    res.json(project);
  } catch (error) {
    console.error('Failed to connect repo:', error);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

/**
 * Get connected projects for user
 */
reposRouter.get('/connected', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Failed to fetch connected repos:', error);
    res.status(500).json({ error: 'Failed to fetch connected repositories' });
  }
});
