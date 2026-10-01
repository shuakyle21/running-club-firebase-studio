export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  paceCategory: string | null;
  createdAt: string;
}

export interface Attendee {
  id: number;
  runId: number;
  userUid: string;
  status: string;
  userName: string | null;
  userPhoto: string | null;
  userPaceCategory?: string | null;
}

export interface RunCommentItem {
  id: number;
  runId: number;
  userUid: string;
  message: string;
  createdAt: string;
  userName: string;
  userPhoto: string;
}

export interface RunItem {
  id: number;
  creatorUid: string;
  title: string;
  description: string;
  meetingPoint: string;
  startLat: string;
  startLng: string;
  distanceKm: string;
  pace: string;
  scheduledAt: string;
  terrainType: string;
  elevationGainM: number;
  routeCoordinates: string; // JSON string array of [lat, lng]
  maxParticipants: number;
  status: string;
  createdAt: string;
  creatorName: string | null;
  creatorPhoto: string | null;
  creatorPaceCategory: string | null;
  attendeeCount: number;
  attendees: Attendee[];
  isUserRsvpd: boolean;
  comments?: RunCommentItem[];
}

export type LatLngTuple = [number, number];

export type RouteDifficulty = 'Easy' | 'Moderate' | 'Hard' | 'Challenging';

export interface RouteItem {
  id: number;
  creatorUid: string;
  title: string;
  description?: string | null;
  distanceKm: string;
  difficulty: RouteDifficulty;
  startLocation: string;
  startLat: string;
  startLng: string;
  terrainType: string;
  elevationGainM: number;
  routeCoordinates: string; // JSON string array of [lat, lng]
  createdAt: string;
  creatorName?: string | null;
  creatorPhoto?: string | null;
}

export interface CreateRouteFormData {
  title: string;
  description: string;
  distanceKm: number;
  difficulty: RouteDifficulty;
  startLocation: string;
  startLat: number;
  startLng: number;
  terrainType: string;
  elevationGainM: number;
  routeCoordinates: LatLngTuple[];
}

export interface CreateRunFormData {
  title: string;
  description: string;
  meetingPoint: string;
  startLat: number;
  startLng: number;
  distanceKm: number;
  pace: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  terrainType: string;
  elevationGainM: number;
  routeCoordinates: LatLngTuple[];
  maxParticipants: number;
  selectedRouteId?: number | null;
}

export type NavigationTab = 'runs' | 'routes' | 'map' | 'post' | 'profile';
