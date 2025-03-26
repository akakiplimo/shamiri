'use server';

import { getMoodById, MOODS } from '@/app/lib/moods';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getPixabayImage, openai } from './public';
import { request } from '@arcjet/next';
import aj from '@/lib/arcjet';
import ai from '@/lib/openai';

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

export async function updateJournalEntry(data) {
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

    const existingEntry = await db.entry.findFirst({
      where: {
        userId: user.id,
        id: data.id,
      },
    });

    if (!existingEntry) {
      throw new Error('Journal entry not found');
    }

    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) {
      throw new Error('Invalid mood');
    }

    let moodImageUrl = existingEntry.moodImageUrl;

    if (existingEntry.mood !== mood.id) {
      moodImageUrl = await getPixabayImage(data.moodQuery);
    }

    const updatedEntry = await db.entry.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodImageUrl,
        moodScore: mood.score,
        categoryId: data.categoryId || null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath(`/journal/${data.id}`);

    return updatedEntry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDraft() {
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

    const draft = await db.draft.findUnique({
      where: {
        userId: user.id,
      },
    });

    return {
      success: true,
      data: draft,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function saveDraft(data) {
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

    const draft = await db.draft.upsert({
      where: {
        userId: user.id,
      },
      create: {
        title: data.title,
        content: data.content,
        mood: data.mood,
        userId: user.id,
      },
      update: {
        title: data.title,
        content: data.content,
        mood: data.mood,
      },
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      data: draft,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function askAIAboutJournals(questions, responses, id) {
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

  // create a string from the entry fields
  const formattedEntry = `Title: ${entry.title}. Content: ${entry.content} Mood: ${entry.mood} Created at: ${entry.createdAt} Last updated: ${entry.updatedAt}`;

  const messages = [
    {
      role: 'system', // Changed from 'developer' to 'system' for standard AI interaction
      content: `
  You are a helpful assistant that answers questions about a user's journals. 
  - Assume all questions are related to the user's journals. 
  - Make sure your answers are concise and to the point.
  - Responses MUST be formatted in clean, valid HTML with proper structure. 
  - Use semantic HTML tags:
    - <p> for paragraphs
    - <strong> for emphasis
    - <em> for additional emphasis
    - <ul> or <ol> for lists
    - <h1> to <h6> for headings
  - Avoid inline styles, JavaScript, or custom attributes.
  
  Response Format Example in JSX:
  <p dangerouslySetInnerHTML={{ __html: YOUR_RESPONSE }} />
  
  User's Journals:
  ${formattedEntry}
      `.trim(), // Use .trim() to remove leading/trailing whitespace
    },
  ];

  // Add user questions and previous assistant responses
  for (let i = 0; i < questions.length; i++) {
    // Add user question
    messages.push({
      role: 'user',
      content: questions[i],
    });

    // Add previous assistant response if available
    if (responses && responses.length > i) {
      messages.push({
        role: 'assistant',
        content: responses[i],
      });
    }
  }

  // Optional: Validate messages before sending
  const validateMessages = (msgs) => {
    return msgs.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === 'string' ? msg.content.trim() : msg.content,
    }));
  };

  const validatedMessages = validateMessages(messages);

  console.log('Prepared messages:', validatedMessages);

  try {
    const completion = await ai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: validatedMessages,
      // Optional additional parameters
      max_tokens: 300, // Limit response length if needed
      temperature: 0.7, // Control creativity
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in AI completion:', error);
    // Handle or rethrow the error as needed
    throw error;
  }
}
