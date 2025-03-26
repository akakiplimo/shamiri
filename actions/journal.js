'use server';

import { getMoodById, MOODS } from '@/app/lib/moods';
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
        categoryId: data.categoryId || null,
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

export async function getJournalEntries({
  categoryId,
  // ---- Filters can be implemented with backend as well ----
  // mood = null,
  // searchQuery = "",
  // startDate = null,
  // endDate = null,
  // page = 1,
  // limit = 10,
  orderBy = 'desc', // or "asc"
} = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error('User not found');

    // Build where clause based on filters
    const where = {
      userId: user.id,
      // If categoryId is explicitly null, get unorganized entries
      // If it's undefined, get all entries
      ...(categoryId === 'unorganized'
        ? { categoryId: null }
        : categoryId
        ? { categoryId }
        : {}),

      // ---- Filters can be implemented with backend as well ----
      // ...(mood && { mood }),
      // ...(searchQuery && {
      //   OR: [
      //     { title: { contains: searchQuery, mode: "insensitive" } },
      //     { content: { contains: searchQuery, mode: "insensitive" } },
      //   ],
      // }),
      // ...((startDate || endDate) && {
      //   createdAt: {
      //     ...(startDate && { gte: new Date(startDate) }),
      //     ...(endDate && { lte: new Date(endDate) }),
      //   },
      // }),
    };

    // ---- Get total count for pagination ----
    // const totalEntries = await db.entry.count({ where });
    // const totalPages = Math.ceil(totalEntries / limit);

    // Get entries with pagination
    const entries = await db.entry.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: orderBy,
      },
      // skip: (page - 1) * limit,
      // take: limit,
    });

    // Add mood data to each entry
    const entriesWithMoodData = entries.map((entry) => ({
      ...entry,
      moodData: getMoodById(entry.mood),
    }));

    return {
      success: true,
      data: {
        entries: entriesWithMoodData,
        // pagination: {
        //   total: totalEntries,
        //   pages: totalPages,
        //   current: page,
        //   hasMore: page < totalPages,
        // },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error('User not found');

    const entry = await db.entry.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!entry) throw new Error('Entry not found');

    return {
      success: true,
      data: {
        entry: {
          ...entry,
          moodData: getMoodById(entry.mood),
        },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const entry = await db.entry.findFirst({
      where: {
        userId: user.id,
        id,
      },
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    await db.entry.delete({
      where: {
        id,
      },
    });

    revalidatePath('/dashboard');

    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}
