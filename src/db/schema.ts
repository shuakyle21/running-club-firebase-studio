import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table storing registered members
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  paceCategory: text('pace_category').default('All Paces'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Runs table storing community runs posted by members
export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  creatorUid: text('creator_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  meetingPoint: text('meeting_point').notNull(),
  startLat: text('start_lat').notNull(),
  startLng: text('start_lng').notNull(),
  distanceKm: text('distance_km').notNull(),
  pace: text('pace').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  terrainType: text('terrain_type').notNull().default('Road'),
  elevationGainM: integer('elevation_gain_m').default(0),
  routeCoordinates: text('route_coordinates').notNull(), // JSON string array of [lat, lng] waypoints
  maxParticipants: integer('max_participants').default(30),
  status: text('status').notNull().default('upcoming'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RSVPs table tracking attendance
export const rsvps = pgTable('rsvps', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  status: text('status').notNull().default('going'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Run comments table for route discussion, questions, and shout-outs
export const runComments = pgTable('run_comments', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Routes table for the member Route Library (saved favorite running routes)
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  creatorUid: text('creator_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  distanceKm: text('distance_km').notNull(),
  difficulty: text('difficulty').notNull().default('Moderate'), // 'Easy' | 'Moderate' | 'Hard' | 'Challenging'
  startLocation: text('start_location').notNull(),
  startLat: text('start_lat').notNull().default('1.2838'),
  startLng: text('start_lng').notNull().default('103.8591'),
  terrainType: text('terrain_type').notNull().default('Road'),
  elevationGainM: integer('elevation_gain_m').default(0),
  routeCoordinates: text('route_coordinates').notNull(), // JSON string array of [lat, lng]
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdRuns: many(runs),
  rsvps: many(rsvps),
  comments: many(runComments),
  routes: many(routes),
}));

export const routesRelations = relations(routes, ({ one }) => ({
  creator: one(users, {
    fields: [routes.creatorUid],
    references: [users.uid],
  }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  creator: one(users, {
    fields: [runs.creatorUid],
    references: [users.uid],
  }),
  rsvps: many(rsvps),
  comments: many(runComments),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  run: one(runs, {
    fields: [rsvps.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [rsvps.userUid],
    references: [users.uid],
  }),
}));

export const runCommentsRelations = relations(runComments, ({ one }) => ({
  run: one(runs, {
    fields: [runComments.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [runComments.userUid],
    references: [users.uid],
  }),
}));
