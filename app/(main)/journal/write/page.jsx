'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
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
import {
  createJournalEntry,
  getDraft,
  getJournalEntry,
  saveDraft,
  updateJournalEntry,
} from '@/actions/journal';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createCategory, getCategories } from '@/actions/category';
import CategoryForm from '@/components/category-dialog';
import { COLORS } from '@/lib/utils';
import { isDirty } from 'zod';
import { Loader2 } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const JournalEntryPage = () => {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);

  const {
    fn: fetchEntry,
    loading: existingEntryLoading,
    data: existingEntry,
  } = useFetch(getJournalEntry);

  const {
    fn: fetchDraft,
    loading: getDraftLoading,
    data: draftData,
  } = useFetch(getDraft);

  const {
    fn: saveDraftFn,
    loading: savingDraft,
    data: savedDraft,
  } = useFetch(saveDraft);

  const {
    fn: journalCreateFn,
    loading: journalCreateLoading,
    data: journalCreateResult,
  } = useFetch(isEditing ? updateJournalEntry : createJournalEntry);

  const {
    fn: createCategoriesFn,
    loading: createCategoriesLoading,
    data: createdCategory,
  } = useFetch(createCategory);

  const {
    fn: fetchCategories,
    loading: categoriesLoading,
    data: categories,
  } = useFetch(getCategories);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: '',
      categoryId: '',
    },
  });

  // watch is more efficient than getValues
  const currentMood = watch('mood');

  useEffect(() => {
    fetchCategories();

    if (editId) {
      setIsEditing(true);
      fetchEntry(editId);
    } else {
      setIsEditing(false);
      fetchDraft();
    }
  }, [editId]);

  useEffect(() => {
    if (isEditing && existingEntry) {
      reset({
        title: existingEntry.data?.entry?.title || '',
        content: existingEntry.data?.entry?.content || '',
        mood: existingEntry.data?.entry?.mood || '',
        categoryId: existingEntry.data?.entry?.categoryId || '',
      });
    } else if (draftData?.success && draftData?.data) {
      reset({
        title: draftData?.data.title || '',
        content: draftData?.data.content || '',
        mood: draftData?.data.mood || '',
        categoryId: '',
      });
    } else {
      reset({
        title: '',
        content: '',
        mood: '',
        categoryId: '',
      });
    }
  }, [draftData, existingEntry, isEditing]);

  useEffect(() => {
    if (journalCreateResult && !journalCreateLoading) {
      if (!isEditing) {
        // clear draft on entry create
        saveDraftFn({
          title: '',
          content: '',
          mood: '',
          categoryId: '',
        });
      }

      router.push(
        `/category/${
          journalCreateResult.categoryId
            ? journalCreateResult.categoryId
            : 'unorganized'
        }`
      );

      toast.success(
        `Journal entry ${isEditing ? 'updated' : 'created'} successfully`
      );
    }
  }, [journalCreateResult, journalCreateLoading]);

  useEffect(() => {
    if (createdCategory) {
      fetchCategories();
      setIsCategoryDialogOpen(false);
      setValue('categoryId', createdCategory.id);
      toast.success(`Category ${createdCategory.name} created successfully`);
    }
  }, [createdCategory]);

  useEffect(() => {
    if (savedDraft?.success && !savingDraft) {
      toast.success('Draft saved successfully');
    }
  }, [savedDraft, savingDraft]);

  const onSubmit = handleSubmit(async (data) => {
    const mood = getMoodById(data.mood);
    journalCreateFn({
      ...data,
      moodScore: mood.score,
      moodQuery: mood.pixabayQuery,
      ...(isEditing && { id: editId }),
    });
  });

  const handleCreateCategory = async (data) => {
    createCategoriesFn(data);
  };

  const handleSaveDraft = async () => {
    if (!isDirty) {
      toast.error('No changes to save');
      return;
    }
    const result = await saveDraftFn({
      title: watch('title'),
      content: watch('content'),
      mood: watch('mood'),
      categoryId: watch('categoryId'),
    });
  };

  const isLoading =
    journalCreateLoading ||
    categoriesLoading ||
    existingEntryLoading ||
    getDraftLoading ||
    savingDraft;

  return (
    <div className="py-8">
      <form className="space-y-2 mx-auto" onSubmit={onSubmit}>
        <h1 className="text-5xl md:text-6xl gradient-title">
          {isEditing ? 'Edit Entry' : "What's on your mind?"}
        </h1>

        {isLoading ? <BarLoader color={COLORS.loader} width={'100%'} /> : null}

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
            Add to Category (Optional)
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => {
              return (
                <Select
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setIsCategoryDialogOpen(true);
                    } else {
                      field.onChange(value);
                    }
                    field.onChange;
                  }}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => {
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      );
                    })}
                    <SelectItem key="new" value="new">
                      <span className="text-blue-600">
                        + Create New Category
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.categoryId && (
            <p className="text-red-500 text-sm">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-x-4 flex">
          <Button
            variant="outline"
            type="button"
            disabled={savingDraft || !isDirty}
            onClick={handleSaveDraft}
          >
            {savingDraft ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save as Draft
          </Button>

          <Button
            type="submit"
            variant="shamiri"
            disabled={journalCreateLoading || !isDirty}
          >
            {isEditing ? 'Update' : 'Publish'}
          </Button>

          {isEditing && (
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/journal/${existingEntry.data?.entry?.id}`);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <CategoryForm
        loading={createCategoriesLoading}
        onSuccess={handleCreateCategory}
        open={isCategoryDialogOpen}
        setOpen={setIsCategoryDialogOpen}
      />
    </div>
  );
};

export default JournalEntryPage;
