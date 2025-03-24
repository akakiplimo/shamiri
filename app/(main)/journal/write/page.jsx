'use client';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import 'react-quill-new/dist/quill.snow.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { journalSchema } from '@/app/lib/schema';
import { BarLoader } from 'react-spinners';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMoodById, MOODS } from '@/app/lib/moods';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { createJournalEntry } from '@/actions/journal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const JournalEntryPage = () => {
  const {
    loading: actionLoading,
    fn: actionFn,
    data: actionResult,
  } = useFetch(createJournalEntry);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    watch,
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: '',
      collectionId: '',
    },
  });

  // watch is more efficient than getValues
  const currentMood = watch('mood');

  const isLoading = actionLoading;

  useEffect(() => {
    if (actionResult && !actionLoading) {
      router.push(
        `/collection/${
          actionResult.collectionId ? actionResult.collectionId : 'unorganized'
        }`
      );

      toast.success('Journal entry created successfully');
    }
  }, [actionResult, actionLoading]);

  const onSubmit = handleSubmit(async (data) => {
    const mood = getMoodById(data.mood);
    actionFn({
      ...data,
      moodScore: mood.score,
      moodQuery: mood.pixabayQuery,
    });
  });

  return (
    <div className="py-8">
      <form className="space-y-2 mx-auto" onSubmit={onSubmit}>
        <h1 className="text-5xl md:text-6xl gradient-title">
          What&apos;s on your mind?
        </h1>

        {isLoading ? <BarLoader color="blue" width={'100%'} /> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            disabled={isLoading}
            {...register('title')}
            placeholder="Give your entry a title..."
            className={`py-5 md:text-md ${
              errors.title ? 'border-red-500' : ''
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">How are you feeling?</label>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={errors.mood ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Select a mood.." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MOODS).map((mood) => (
                      <SelectItem key={mood.id} value={mood.id}>
                        <span className="flex items-center gap-2">
                          {mood.emoji} {mood.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.mood && (
            <p className="text-red-500 text-sm">{errors.mood.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {getMoodById(currentMood)?.prompt ?? 'Write your thoughts...'}
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <ReactQuill
                readOnly={isLoading}
                theme="snow"
                value={field.value}
                onChange={field.onChange}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [
                      { list: 'ordered' },
                      { list: 'bullet' },
                      { indent: '-1' },
                      { indent: '+1' },
                    ],
                    ['blockquote', 'code-block'],
                    ['link', 'image', 'video'],
                    ['clean'],
                  ],
                }}
              />
            )}
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Add to Collection (Optional)
          </label>
          {/* <Controller
            name="content"
            control={control}
            render={({ field }) => (
            )}
          /> */}
          {errors.collectionId && (
            <p className="text-red-500 text-sm">
              {errors.collectionId.message}
            </p>
          )}
        </div>

        <div className="space-y-4 flex">
          <Button type="submit" variant="shamiri">
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JournalEntryPage;
