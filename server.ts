import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserByUid } from './src/db/users.ts';
import {
  getUpcomingRuns,
  getRunDetails,
  createRun,
  toggleRunRsvp,
  addRunComment,
} from './src/db/runs.ts';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  deleteRoute,
  seedInitialRoutesIfEmpty,
} from './src/db/routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'stride-running-club' });
  });

  // 2. Sync user profile on login
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const { displayName, photoURL, paceCategory } = req.body;
      const dbUser = await getOrCreateUser(
        user.uid,
        user.email || 'runner@example.com',
        displayName || user.name,
        photoURL || user.picture,
        paceCategory
      );
      res.json({ success: true, user: dbUser });
    } catch (error: any) {
      console.error('Failed to sync user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // 3. Current user profile
  app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const dbUser = await getUserByUid(user.uid);
      res.json({ user: dbUser });
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
  });

  // 4. Get all upcoming runs
  app.get('/api/runs', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user?.uid;
      const runs = await getUpcomingRuns(currentUserId);
      res.json(runs);
    } catch (error: any) {
      console.error('Failed to fetch runs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch runs' });
    }
  });

  // 5. Get run details by ID
  app.get('/api/runs/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const runId = parseInt(req.params.id, 10);
      if (isNaN(runId)) {
        return res.status(400).json({ error: 'Invalid run ID' });
      }
      const currentUserId = req.user?.uid;
      const run = await getRunDetails(runId, currentUserId);
      if (!run) {
        return res.status(404).json({ error: 'Run not found' });
      }
      res.json(run);
    } catch (error: any) {
      console.error('Failed to fetch run details:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch run details' });
    }
  });

  // 6. Create a new run
  app.post('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const {
        title,
        description,
        meetingPoint,
        startLat,
        startLng,
        distanceKm,
        pace,
        scheduledAt,
        terrainType,
        elevationGainM,
        routeCoordinates,
        maxParticipants,
      } = req.body;

      if (!title || !meetingPoint || !distanceKm || !scheduledAt || !routeCoordinates) {
        return res.status(400).json({ error: 'Missing required run fields' });
      }

      // Ensure user exists in Cloud SQL
      await getOrCreateUser(
        user.uid,
        user.email || 'runner@example.com',
        user.name,
        user.picture
      );

      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled date' });
      }

      const newRun = await createRun({
        creatorUid: user.uid,
        title: title.trim(),
        description: (description || 'No description provided.').trim(),
        meetingPoint: meetingPoint.trim(),
        startLat: String(startLat || '1.2838'),
        startLng: String(startLng || '103.8591'),
        distanceKm: String(distanceKm),
        pace: pace || 'All Paces Welcome',
        scheduledAt: parsedDate,
        terrainType: terrainType || 'Road',
        elevationGainM: Number(elevationGainM) || 0,
        routeCoordinates: typeof routeCoordinates === 'string' ? routeCoordinates : JSON.stringify(routeCoordinates),
        maxParticipants: Number(maxParticipants) || 30,
      });

      res.status(201).json(newRun);
    } catch (error: any) {
      console.error('Failed to create run:', error);
      res.status(500).json({ error: error.message || 'Failed to create run' });
    }
  });

  // 7. Toggle RSVP for a run
  app.post('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
    try {
      const runId = parseInt(req.params.id, 10);
      if (isNaN(runId)) {
        return res.status(400).json({ error: 'Invalid run ID' });
      }
      const user = req.user!;
      // Ensure user exists
      await getOrCreateUser(
        user.uid,
        user.email || 'runner@example.com',
        user.name,
        user.picture
      );

      const result = await toggleRunRsvp(runId, user.uid);
      res.json(result);
    } catch (error: any) {
      console.error('Failed to toggle RSVP:', error);
      res.status(500).json({ error: error.message || 'Failed to toggle RSVP' });
    }
  });

  // 8. Add a comment to a run
  app.post('/api/runs/:id/comments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const runId = parseInt(req.params.id, 10);
      if (isNaN(runId)) {
        return res.status(400).json({ error: 'Invalid run ID' });
      }
      const user = req.user!;
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      await getOrCreateUser(
        user.uid,
        user.email || 'runner@example.com',
        user.name,
        user.picture
      );

      const comment = await addRunComment(runId, user.uid, message);
      res.status(201).json(comment);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      res.status(500).json({ error: error.message || 'Failed to add comment' });
    }
  });

  // 9. Route Library: Get all saved routes
  app.get('/api/routes', async (req, res) => {
    try {
      const allRoutes = await getAllRoutes();
      res.json(allRoutes);
    } catch (error: any) {
      console.error('Failed to fetch route library:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch routes' });
    }
  });

  // 10. Route Library: Get route details by ID
  app.get('/api/routes/:id', async (req, res) => {
    try {
      const routeId = parseInt(req.params.id, 10);
      if (isNaN(routeId)) {
        return res.status(400).json({ error: 'Invalid route ID' });
      }
      const routeItem = await getRouteById(routeId);
      if (!routeItem) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.json(routeItem);
    } catch (error: any) {
      console.error('Failed to fetch route:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch route' });
    }
  });

  // 11. Route Library: Save a new favorite route
  app.post('/api/routes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const {
        title,
        description,
        distanceKm,
        difficulty,
        startLocation,
        startLat,
        startLng,
        terrainType,
        elevationGainM,
        routeCoordinates,
      } = req.body;

      if (!title || !distanceKm || !startLocation || !routeCoordinates) {
        return res.status(400).json({ error: 'Missing required route fields (title, distance, start location, coordinates)' });
      }

      // Ensure user profile exists
      await getOrCreateUser(
        user.uid,
        user.email || 'runner@example.com',
        user.name,
        user.picture
      );

      const validDifficulty = ['Easy', 'Moderate', 'Hard', 'Challenging'].includes(difficulty)
        ? difficulty
        : 'Moderate';

      const newRoute = await createRoute({
        creatorUid: user.uid,
        title: title.trim(),
        description: description ? description.trim() : '',
        distanceKm: String(distanceKm),
        difficulty: validDifficulty,
        startLocation: startLocation.trim(),
        startLat: String(startLat || '1.2838'),
        startLng: String(startLng || '103.8591'),
        terrainType: terrainType || 'Road',
        elevationGainM: Number(elevationGainM) || 0,
        routeCoordinates: typeof routeCoordinates === 'string' ? routeCoordinates : JSON.stringify(routeCoordinates),
      });

      res.status(201).json(newRoute);
    } catch (error: any) {
      console.error('Failed to save route to library:', error);
      res.status(500).json({ error: error.message || 'Failed to save route' });
    }
  });

  // 12. Route Library: Delete a route (creator only)
  app.delete('/api/routes/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const routeId = parseInt(req.params.id, 10);
      if (isNaN(routeId)) {
        return res.status(400).json({ error: 'Invalid route ID' });
      }
      const user = req.user!;
      const result = await deleteRoute(routeId, user.uid);
      if (!result.success) {
        if (result.reason === 'not_found') {
          return res.status(404).json({ error: 'Route not found' });
        }
        return res.status(403).json({ error: 'Only the route creator can delete this route' });
      }
      res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error: any) {
      console.error('Failed to delete route:', error);
      res.status(500).json({ error: error.message || 'Failed to delete route' });
    }
  });

  // Ensure default seed routes are available in Route Library
  seedInitialRoutesIfEmpty().catch((err) => {
    console.warn('Initial route seed check error:', err);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stride Running Club server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
