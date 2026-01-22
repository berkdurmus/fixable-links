import { Router, Request, Response } from 'express';
import { requireAuth, getUser, UserPayload } from '../middleware/auth';
import { prisma } from '../index';
import { GitHubService } from '../services/github';

export const pullRequestsRouter = Router();

/**
 * Create a new pull request
 */
pullRequestsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { projectId, changes, title, description, branch, baseBranch, websiteUrl } = req.body;

    if (!projectId || !changes || !Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'Project ID and changes required' });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create PR record in database first
    const pullRequest = await prisma.pullRequest.create({
      data: {
        userId: user.id,
        projectId,
        title: title || `Update website content from ${new URL(websiteUrl || 'https://example.com').hostname}`,
        description,
        status: 'creating',
        branch: branch || `plsfix/${Date.now()}`,
        baseBranch: baseBranch || project.defaultBranch,
        websiteUrl: websiteUrl || '',
        changesCount: changes.length,
      },
    });

    // Return immediately with creating status
    res.json({
      id: pullRequest.id,
      status: pullRequest.status,
      createdAt: pullRequest.createdAt,
    });

    // Process PR creation in background
    processPullRequest(user, project, pullRequest, changes).catch((error) => {
      console.error('Background PR processing failed:', error);
    });
  } catch (error) {
    console.error('Failed to create pull request:', error);
    res.status(500).json({ error: 'Failed to create pull request' });
  }
});

/**
 * Process PR creation in background
 */
async function processPullRequest(
  user: UserPayload | undefined,
  project: any,
  pullRequest: any,
  changes: any[]
) {
  try {
    // Update status to processing
    await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: { status: 'processing' },
    });

    const github = new GitHubService(user!.accessToken);
    const [owner, repo] = project.repoFullName.split('/');

    // Update status to analyzing
    await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: { status: 'analyzing' },
    });

    // Create branch
    await github.createBranch(owner, repo, pullRequest.branch, pullRequest.baseBranch);

    // Generate file changes from DOM changes
    // For MVP, we'll create a simple JSON file with the changes
    // In a real implementation, this would analyze the codebase and modify actual files
    const changesContent = JSON.stringify(
      {
        websiteUrl: pullRequest.websiteUrl,
        timestamp: new Date().toISOString(),
        changes: changes.map((c) => ({
          type: c.type,
          elementTag: c.elementTag,
          xpath: c.xpath,
          selector: c.selector,
          original: c.original,
          modified: c.modified,
        })),
      },
      null,
      2
    );

    // Create/update files
    await github.createOrUpdateFile(
      owner,
      repo,
      pullRequest.branch,
      '.plsfix/changes.json',
      changesContent,
      `Update website content via plsfix\n\nChanges from: ${pullRequest.websiteUrl}`
    );

    // Create the pull request on GitHub
    const prResult = await github.createPullRequest(
      owner,
      repo,
      pullRequest.title,
      pullRequest.branch,
      pullRequest.baseBranch,
      `## Summary\n\nThis PR contains ${changes.length} change(s) made via plsfix browser extension.\n\n**Website:** ${pullRequest.websiteUrl}\n\n## Changes\n\n${changes.map((c) => `- ${c.type} change on \`<${c.elementTag}>\``).join('\n')}\n\n---\n*Created with [plsfix](https://github.com/plsfix/plsfix)*`
    );

    // Update PR record with GitHub details
    await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: {
        status: 'open',
        prNumber: prResult.number,
        githubUrl: prResult.html_url,
      },
    });

    // Link changes to PR
    await prisma.change.createMany({
      data: changes.map((change) => ({
        projectId: project.id,
        pullRequestId: pullRequest.id,
        type: change.type,
        elementTag: change.elementTag,
        xpath: change.xpath,
        selector: change.selector,
        originalValue: change.original,
        modifiedValue: change.modified,
        pageUrl: pullRequest.websiteUrl,
      })),
    });
  } catch (error) {
    console.error('PR processing error:', error);
    // Update status to indicate failure
    await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: {
        status: 'creating', // Reset to creating to allow retry
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
  }
}

/**
 * Get pull requests for user
 */
pullRequestsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { projectId, websiteUrl } = req.query;

    const where: any = { userId: user.id };
    if (projectId) {
      where.projectId = projectId;
    }
    if (websiteUrl) {
      where.websiteUrl = websiteUrl;
    }

    const pullRequests = await prisma.pullRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            repoFullName: true,
            repoName: true,
          },
        },
      },
    });

    res.json(pullRequests);
  } catch (error) {
    console.error('Failed to fetch pull requests:', error);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

/**
 * Get a specific pull request
 */
pullRequestsRouter.get('/:prId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { prId } = req.params;

    const pullRequest = await prisma.pullRequest.findFirst({
      where: {
        id: prId,
        userId: user.id,
      },
      include: {
        project: true,
        changes: true,
      },
    });

    if (!pullRequest) {
      return res.status(404).json({ error: 'Pull request not found' });
    }

    res.json(pullRequest);
  } catch (error) {
    console.error('Failed to fetch pull request:', error);
    res.status(500).json({ error: 'Failed to fetch pull request' });
  }
});
