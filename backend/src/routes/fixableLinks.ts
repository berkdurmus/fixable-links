import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import crypto from 'crypto';

export const fixableLinksRouter = Router();

// Generate a short, URL-safe code (using crypto instead of nanoid for CommonJS compatibility)
function generateShortCode(): string {
  return crypto.randomBytes(4).toString('base64url').slice(0, 8);
}

// Get fixable link by short code (public endpoint)
fixableLinksRouter.get('/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    const link = await prisma.fixableLink.findUnique({
      where: { shortCode },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            repoFullName: true,
            repoName: true,
            defaultBranch: true,
          },
        },
      },
    });

    if (!link) {
      res.status(404).json({ error: 'Fixable link not found' });
      return;
    }

    // Increment view count
    await prisma.fixableLink.update({
      where: { shortCode },
      data: { viewCount: { increment: 1 } },
    });

    res.json(link);
  } catch (error) {
    console.error('Error fetching fixable link:', error);
    res.status(500).json({ error: 'Failed to fetch fixable link' });
  }
});

// Create a new fixable link
fixableLinksRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetUrl, title, description, projectId, settings, isPublic = true } = req.body;

    if (!targetUrl) {
      res.status(400).json({ error: 'Target URL is required' });
      return;
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Get user ID if authenticated (optional)
    const userId = (req.user as { id: string } | undefined)?.id;

    // Generate unique short code
    let shortCode = generateShortCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.fixableLink.findUnique({ where: { shortCode } });
      if (!existing) break;
      shortCode = generateShortCode();
      attempts++;
    }

    const link = await prisma.fixableLink.create({
      data: {
        shortCode,
        targetUrl,
        title: title || new URL(targetUrl).hostname,
        description,
        creatorId: userId,
        projectId,
        settings,
        isPublic,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating fixable link:', error);
    res.status(500).json({ error: 'Failed to create fixable link' });
  }
});

// List user's fixable links (requires auth)
fixableLinksRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as { id: string } | undefined)?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const links = await prisma.fixableLink.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            repoFullName: true,
            repoName: true,
          },
        },
      },
    });

    res.json(links);
  } catch (error) {
    console.error('Error listing fixable links:', error);
    res.status(500).json({ error: 'Failed to list fixable links' });
  }
});

// Update a fixable link
fixableLinksRouter.patch('/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const { title, description, projectId, settings, isPublic } = req.body;
    const userId = (req.user as { id: string } | undefined)?.id;

    const link = await prisma.fixableLink.findUnique({ where: { shortCode } });

    if (!link) {
      res.status(404).json({ error: 'Fixable link not found' });
      return;
    }

    // Only creator can update
    if (link.creatorId && link.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized to update this link' });
      return;
    }

    const updated = await prisma.fixableLink.update({
      where: { shortCode },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(projectId !== undefined && { projectId }),
        ...(settings !== undefined && { settings }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating fixable link:', error);
    res.status(500).json({ error: 'Failed to update fixable link' });
  }
});

// Delete a fixable link
fixableLinksRouter.delete('/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const userId = (req.user as { id: string } | undefined)?.id;

    const link = await prisma.fixableLink.findUnique({ where: { shortCode } });

    if (!link) {
      res.status(404).json({ error: 'Fixable link not found' });
      return;
    }

    // Only creator can delete
    if (link.creatorId && link.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this link' });
      return;
    }

    await prisma.fixableLink.delete({ where: { shortCode } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixable link:', error);
    res.status(500).json({ error: 'Failed to delete fixable link' });
  }
});
