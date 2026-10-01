import { db } from './index.ts';
import { routes, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface CreateRouteInput {
  creatorUid: string;
  title: string;
  description?: string;
  distanceKm: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Challenging';
  startLocation: string;
  startLat: string;
  startLng: string;
  terrainType: string;
  elevationGainM?: number;
  routeCoordinates: string; // JSON string array of [lat, lng]
}

export async function getAllRoutes() {
  try {
    const result = await db
      .select({
        id: routes.id,
        creatorUid: routes.creatorUid,
        title: routes.title,
        description: routes.description,
        distanceKm: routes.distanceKm,
        difficulty: routes.difficulty,
        startLocation: routes.startLocation,
        startLat: routes.startLat,
        startLng: routes.startLng,
        terrainType: routes.terrainType,
        elevationGainM: routes.elevationGainM,
        routeCoordinates: routes.routeCoordinates,
        createdAt: routes.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoURL,
      })
      .from(routes)
      .leftJoin(users, eq(routes.creatorUid, users.uid))
      .orderBy(desc(routes.createdAt));

    return result;
  } catch (error) {
    console.error('Failed to get routes from Cloud SQL:', error);
    throw new Error('Database query failed for routes', { cause: error });
  }
}

export async function getRouteById(id: number) {
  try {
    const result = await db
      .select({
        id: routes.id,
        creatorUid: routes.creatorUid,
        title: routes.title,
        description: routes.description,
        distanceKm: routes.distanceKm,
        difficulty: routes.difficulty,
        startLocation: routes.startLocation,
        startLat: routes.startLat,
        startLng: routes.startLng,
        terrainType: routes.terrainType,
        elevationGainM: routes.elevationGainM,
        routeCoordinates: routes.routeCoordinates,
        createdAt: routes.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoURL,
      })
      .from(routes)
      .leftJoin(users, eq(routes.creatorUid, users.uid))
      .where(eq(routes.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Failed to get route by id from Cloud SQL:', error);
    throw new Error('Database query failed for route', { cause: error });
  }
}

export async function createRoute(input: CreateRouteInput) {
  try {
    const inserted = await db
      .insert(routes)
      .values({
        creatorUid: input.creatorUid,
        title: input.title,
        description: input.description || null,
        distanceKm: input.distanceKm,
        difficulty: input.difficulty,
        startLocation: input.startLocation,
        startLat: input.startLat,
        startLng: input.startLng,
        terrainType: input.terrainType,
        elevationGainM: input.elevationGainM ?? 0,
        routeCoordinates: input.routeCoordinates,
      })
      .returning();

    // Fetch creator details
    const creator = await db
      .select({
        displayName: users.displayName,
        photoURL: users.photoURL,
      })
      .from(users)
      .where(eq(users.uid, input.creatorUid))
      .limit(1);

    return {
      ...inserted[0],
      creatorName: creator[0]?.displayName || 'Club Member',
      creatorPhoto: creator[0]?.photoURL || null,
    };
  } catch (error) {
    console.error('Failed to create route in Cloud SQL:', error);
    throw new Error('Database insert failed for route', { cause: error });
  }
}

export async function deleteRoute(id: number, userUid: string) {
  try {
    const existing = await db
      .select()
      .from(routes)
      .where(eq(routes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, reason: 'not_found' };
    }

    if (existing[0].creatorUid !== userUid) {
      return { success: false, reason: 'unauthorized' };
    }

    await db.delete(routes).where(eq(routes.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete route from Cloud SQL:', error);
    throw new Error('Database delete failed for route', { cause: error });
  }
}

// Seed community favorite routes if empty
export async function seedInitialRoutesIfEmpty() {
  try {
    const existing = await db.select({ id: routes.id }).from(routes).limit(1);
    if (existing.length > 0) {
      return;
    }

    const defaultSeedRoutes = [
      {
        creatorUid: 'coach-sarah-m',
        title: 'Marina Bay Waterfront Loop',
        description: 'Iconic flat 5.2KM harbor run past Marina Bay Sands, Helix Bridge, and the Merlion. Smooth asphalt with scenic water breezes, perfect for beginners and tempo runners alike.',
        distanceKm: '5.2',
        difficulty: 'Easy' as const,
        startLocation: 'Marina Bay Waterfront Promenade (Near Event Square)',
        startLat: '1.2838',
        startLng: '103.8591',
        terrainType: 'Paved / Asphalt',
        elevationGainM: 12,
        routeCoordinates: JSON.stringify([
          [1.2838, 103.8591],
          [1.2865, 103.8580],
          [1.2895, 103.8562],
          [1.2915, 103.8595],
          [1.2890, 103.8610],
          [1.2845, 103.8605],
          [1.2838, 103.8591],
        ]),
      },
      {
        creatorUid: 'marcus-tan-run',
        title: 'Fort Canning Hill Tempo & Historic Stairs',
        description: 'Challenging 7.4KM circuit featuring historic hill climbs, shaded greenery, and rolling brick/stone trails. Great for leg strength and threshold training.',
        distanceKm: '7.4',
        difficulty: 'Hard' as const,
        startLocation: 'Fort Canning Green (Gothic Gate Entrance)',
        startLat: '1.2931',
        startLng: '103.8475',
        terrainType: 'Trail & Stairs',
        elevationGainM: 110,
        routeCoordinates: JSON.stringify([
          [1.2931, 103.8475],
          [1.2952, 103.8460],
          [1.2970, 103.8485],
          [1.2955, 103.8510],
          [1.2925, 103.8495],
          [1.2910, 103.8465],
          [1.2931, 103.8475],
        ]),
      },
      {
        creatorUid: 'elena-rostova',
        title: 'East Coast Coastal Expressway Strip',
        description: 'Fast, uninterrupted coastal road trail alongside the beach. Pure ocean crosswinds, flat sprint sections, and water stations every 2 kilometers.',
        distanceKm: '10.5',
        difficulty: 'Moderate' as const,
        startLocation: 'East Coast Park Parkland Green',
        startLat: '1.3005',
        startLng: '103.9025',
        terrainType: 'Road & Coastal Path',
        elevationGainM: 24,
        routeCoordinates: JSON.stringify([
          [1.3005, 103.9025],
          [1.3025, 103.9100],
          [1.3045, 103.9200],
          [1.3070, 103.9350],
          [1.3045, 103.9200],
          [1.3025, 103.9100],
          [1.3005, 103.9025],
        ]),
      },
      {
        creatorUid: 'coach-sarah-m',
        title: 'Gardens by the Bay & Barrage Skyway',
        description: 'Sunset-ready 6.0KM route circling the futuristic Supertree Grove, crossing the Marina Barrage dam, and finishing along the waterfront meadow.',
        distanceKm: '6.0',
        difficulty: 'Easy' as const,
        startLocation: 'Supertree Grove Info Hub',
        startLat: '1.2816',
        startLng: '103.8636',
        terrainType: 'Park / Paved',
        elevationGainM: 18,
        routeCoordinates: JSON.stringify([
          [1.2816, 103.8636],
          [1.2800, 103.8680],
          [1.2810, 103.8710],
          [1.2835, 103.8700],
          [1.2850, 103.8660],
          [1.2830, 103.8640],
          [1.2816, 103.8636],
        ]),
      },
    ];

    for (const item of defaultSeedRoutes) {
      await db.insert(routes).values(item);
    }
    console.log('Seeded initial Route Library successfully.');
  } catch (error) {
    console.warn('Initial route seed skipped or already seeded:', error);
  }
}
