'use server';

import { MOODS } from '@/app/lib/moods';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getPixabayImage } from './public';
import { request } from '@arcjet/next';
import aj from '@/lib/arcjet';

export async function createJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    //ArcJet Rate Limiting
    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error('Too many requests. Please try again later');
      }

      throw new Error('Request denied');
    }

    // ArcJet Rate Limiting

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) {
      throw new Error('Invalid mood');
    }

    const moodImageUrl = await getPixabayImage(data.moodQuery);

    const entry = await db.entry.create({
      data: {
        title: data.title,
        content: data.content,
        userId: user.id,
        mood: mood.id,
        moodImageUrl,
        moodScore: mood.score,
        collectionId: data.collectionId || null,
      },
    });

    await db.draft.deleteMany({
      where: {
        userId: user.id,
      },
    });

    revalidatePath('/dashboard');
    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}
