import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string,
  paceCategory?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || '',
        paceCategory: paceCategory || 'All Paces',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
          ...(photoURL ? { photoURL } : {}),
          ...(paceCategory ? { paceCategory } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user in Cloud SQL:', error);
    throw new Error('Database operation failed for user', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const userList = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return userList[0] || null;
  } catch (error) {
    console.error('Failed to get user by uid:', error);
    throw new Error('Database operation failed for user lookup', { cause: error });
  }
}
