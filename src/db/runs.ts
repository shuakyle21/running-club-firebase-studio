import { db } from './index.ts';
import { runs, users, rsvps, runComments } from './schema.ts';
import { eq, desc, asc, and } from 'drizzle-orm';

export interface CreateRunInput {
  creatorUid: string;
  title: string;
  description: string;
  meetingPoint: string;
  startLat: string;
  startLng: string;
  distanceKm: string;
  pace: string;
  scheduledAt: Date;
  terrainType: string;
  elevationGainM?: number;
  routeCoordinates: string; // JSON string of [lat, lng][]
  maxParticipants?: number;
}

export async function getUpcomingRuns(currentUserId?: string) {
  try {
    const allRuns = await db
      .select({
        id: runs.id,
        creatorUid: runs.creatorUid,
        title: runs.title,
        description: runs.description,
        meetingPoint: runs.meetingPoint,
        startLat: runs.startLat,
        startLng: runs.startLng,
        distanceKm: runs.distanceKm,
        pace: runs.pace,
        scheduledAt: runs.scheduledAt,
        terrainType: runs.terrainType,
        elevationGainM: runs.elevationGainM,
        routeCoordinates: runs.routeCoordinates,
        maxParticipants: runs.maxParticipants,
        status: runs.status,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoURL,
        creatorPaceCategory: users.paceCategory,
      })
      .from(runs)
      .leftJoin(users, eq(runs.creatorUid, users.uid))
      .orderBy(asc(runs.scheduledAt));

    // Fetch all RSVPs for these runs
    const allRsvps = await db
      .select({
        id: rsvps.id,
        runId: rsvps.runId,
        userUid: rsvps.userUid,
        status: rsvps.status,
        userName: users.displayName,
        userPhoto: users.photoURL,
        userPaceCategory: users.paceCategory,
      })
      .from(rsvps)
      .leftJoin(users, eq(rsvps.userUid, users.uid));

    // Combine data
    return allRuns.map((run) => {
      const runRsvps = allRsvps.filter((r) => r.runId === run.id && r.status === 'going');
      const isUserRsvpd = currentUserId
        ? runRsvps.some((r) => r.userUid === currentUserId)
        : false;

      return {
        ...run,
        attendeeCount: runRsvps.length,
        attendees: runRsvps,
        isUserRsvpd,
      };
    });
  } catch (error) {
    console.error('Failed to get upcoming runs from Cloud SQL:', error);
    throw new Error('Database query failed for upcoming runs', { cause: error });
  }
}

export async function getRunDetails(runId: number, currentUserId?: string) {
  try {
    const runResult = await db
      .select({
        id: runs.id,
        creatorUid: runs.creatorUid,
        title: runs.title,
        description: runs.description,
        meetingPoint: runs.meetingPoint,
        startLat: runs.startLat,
        startLng: runs.startLng,
        distanceKm: runs.distanceKm,
        pace: runs.pace,
        scheduledAt: runs.scheduledAt,
        terrainType: runs.terrainType,
        elevationGainM: runs.elevationGainM,
        routeCoordinates: runs.routeCoordinates,
        maxParticipants: runs.maxParticipants,
        status: runs.status,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoURL,
        creatorPaceCategory: users.paceCategory,
      })
      .from(runs)
      .leftJoin(users, eq(runs.creatorUid, users.uid))
      .where(eq(runs.id, runId))
      .limit(1);

    if (runResult.length === 0) {
      return null;
    }

    const run = runResult[0];

    const runRsvps = await db
      .select({
        id: rsvps.id,
        userUid: rsvps.userUid,
        status: rsvps.status,
        createdAt: rsvps.createdAt,
        userName: users.displayName,
        userPhoto: users.photoURL,
        userPaceCategory: users.paceCategory,
      })
      .from(rsvps)
      .leftJoin(users, eq(rsvps.userUid, users.uid))
      .where(and(eq(rsvps.runId, runId), eq(rsvps.status, 'going')));

    const comments = await db
      .select({
        id: runComments.id,
        userUid: runComments.userUid,
        message: runComments.message,
        createdAt: runComments.createdAt,
        userName: users.displayName,
        userPhoto: users.photoURL,
      })
      .from(runComments)
      .leftJoin(users, eq(runComments.userUid, users.uid))
      .where(eq(runComments.runId, runId))
      .orderBy(asc(runComments.createdAt));

    const isUserRsvpd = currentUserId
      ? runRsvps.some((r) => r.userUid === currentUserId)
      : false;

    return {
      ...run,
      attendees: runRsvps,
      attendeeCount: runRsvps.length,
      isUserRsvpd,
      comments,
    };
  } catch (error) {
    console.error('Failed to get run details from Cloud SQL:', error);
    throw new Error('Database query failed for run details', { cause: error });
  }
}

export async function createRun(input: CreateRunInput) {
  try {
    const newRun = await db
      .insert(runs)
      .values({
        creatorUid: input.creatorUid,
        title: input.title,
        description: input.description,
        meetingPoint: input.meetingPoint,
        startLat: input.startLat,
        startLng: input.startLng,
        distanceKm: input.distanceKm,
        pace: input.pace,
        scheduledAt: input.scheduledAt,
        terrainType: input.terrainType,
        elevationGainM: input.elevationGainM ?? 0,
        routeCoordinates: input.routeCoordinates,
        maxParticipants: input.maxParticipants ?? 30,
        status: 'upcoming',
      })
      .returning();

    // Automatically RSVP the creator as going
    if (newRun.length > 0) {
      await db
        .insert(rsvps)
        .values({
          runId: newRun[0].id,
          userUid: input.creatorUid,
          status: 'going',
        })
        .onConflictDoNothing();
    }

    return newRun[0];
  } catch (error) {
    console.error('Failed to create run in Cloud SQL:', error);
    throw new Error('Database insert failed for new run', { cause: error });
  }
}

export async function toggleRunRsvp(runId: number, userUid: string) {
  try {
    // Check if RSVP exists
    const existing = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.runId, runId), eq(rsvps.userUid, userUid)))
      .limit(1);

    if (existing.length > 0 && existing[0].status === 'going') {
      // Cancel RSVP
      await db
        .delete(rsvps)
        .where(and(eq(rsvps.runId, runId), eq(rsvps.userUid, userUid)));
      return { rsvpd: false };
    } else {
      // Insert or update RSVP to going
      await db
        .insert(rsvps)
        .values({
          runId,
          userUid,
          status: 'going',
        });
      return { rsvpd: true };
    }
  } catch (error) {
    console.error('Failed to toggle run RSVP in Cloud SQL:', error);
    throw new Error('Database operation failed for RSVP', { cause: error });
  }
}

export async function addRunComment(runId: number, userUid: string, message: string) {
  try {
    const comment = await db
      .insert(runComments)
      .values({
        runId,
        userUid,
        message: message.trim(),
      })
      .returning();

    // Fetch author details
    const author = await db
      .select({
        displayName: users.displayName,
        photoURL: users.photoURL,
      })
      .from(users)
      .where(eq(users.uid, userUid))
      .limit(1);

    return {
      ...comment[0],
      userName: author[0]?.displayName || 'Runner',
      userPhoto: author[0]?.photoURL || '',
    };
  } catch (error) {
    console.error('Failed to add run comment in Cloud SQL:', error);
    throw new Error('Database insert failed for comment', { cause: error });
  }
}
