'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BarLoader } from 'react-spinners';
import { COLORS } from '@/lib/utils';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { categorySchema } from '@/app/lib/schema';
import { Button } from './ui/button';

const CategoryForm = ({ onSuccess, loading, open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onFormSubmit = handleSubmit(async (data) => {
    onSuccess(data);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>

        {loading ? <BarLoader color={COLORS.loader} width={'100%'} /> : null}

        <form onSubmit={onFormSubmit} className="space-y-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              disabled={loading}
              {...register('name')}
              placeholder="Enter category name..."
              className={`${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              disabled={loading}
              {...register('description')}
              placeholder="Describe your collection..."
              className={`${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="shamiri">
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
