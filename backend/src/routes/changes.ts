import { Router, Request, Response } from 'express';
import { requireAuth, getUser } from '../middleware/auth';
import { prisma } from '../index';

export const changesRouter = Router();

/**
 * Save changes for a project
 */
changesRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { projectId, changes } = req.body;

    if (!projectId || !changes || !Array.isArray(changes)) {
      return res.status(400).json({ error: 'Project ID and changes array required' });
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

    // Create changes
    const createdChanges = await prisma.change.createMany({
      data: changes.map((change: any) => ({
        projectId,
        type: change.type,
        elementTag: change.elementTag,
        xpath: change.xpath,
        selector: change.selector,
        originalValue: change.original,
        modifiedValue: change.modified,
        pageUrl: change.pageUrl,
      })),
    });

    res.json({ count: createdChanges.count });
  } catch (error) {
    console.error('Failed to save changes:', error);
    res.status(500).json({ error: 'Failed to save changes' });
  }
});

/**
 * Get changes for a project
 */
changesRouter.get('/:projectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { projectId } = req.params;

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

    const changes = await prisma.change.findMany({
      where: {
        projectId,
        pullRequestId: null, // Only get changes not yet in a PR
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(changes);
  } catch (error) {
    console.error('Failed to fetch changes:', error);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

/**
 * Delete a change
 */
changesRouter.delete('/:changeId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { changeId } = req.params;

    // Find change and verify ownership
    const change = await prisma.change.findUnique({
      where: { id: changeId },
      include: { project: true },
    });

    if (!change || change.project.userId !== user.id) {
      return res.status(404).json({ error: 'Change not found' });
    }

    // Don't allow deleting changes that are already in a PR
    if (change.pullRequestId) {
      return res.status(400).json({ error: 'Cannot delete change that is part of a pull request' });
    }

    await prisma.change.delete({
      where: { id: changeId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete change:', error);
    res.status(500).json({ error: 'Failed to delete change' });
  }
});
