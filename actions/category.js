'use server';

import aj from '@/lib/arcjet';
import { db } from '@/lib/prisma';
import { request } from '@arcjet/next';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function createCategory(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

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

    const category = await db.category.create({
      data: {
        name: data.name,
        description: data.description,
        userId: user.id,
      },
    });

    revalidatePath('/dashboard');
    return category;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getCategories(data) {
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

  const categories = await db.category?.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { createdAt: 'desc' },
  });

  return categories;
}

export async function getCategory(categoryId) {
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

  const categories = await db.category?.findUnique({
    where: {
      userId: user.id,
      id: categoryId,
    },
  });

  return categories;
}

// deleteCategory server action
export async function deleteCategory(categoryId) {
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

    const categories = await db.category.findFirst({
      where: {
        userId: user.id,
        id: categoryId,
      },
    });

    if (!categories) {
      throw new Error('Category not found');
    }

    await db.category.delete({
      where: {
        id: categoryId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
