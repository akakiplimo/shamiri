'use client';

import React, { useState, useEffect } from 'react';
import CategoryPreview from './category-preview';
import CategoryForm from '@/components/category-dialog';
import { createCategory } from '@/actions/category';
import useFetch from '@/hooks/use-fetch';
import { toast } from 'sonner';

const Categories = ({ categories = [], entriesByCategory }) => {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const {
    fn: createCategoriesFn,
    loading: createCategoriesLoading,
    data: createdCategory,
  } = useFetch(createCategory);

  useEffect(() => {
    if (createdCategory) {
      setIsCategoryDialogOpen(false);
      toast.success(`Category ${createdCategory.name} created successfully`);
    }
  }, [createdCategory]);

  const handleCreateCategory = async (data) => {
    await createCategoriesFn(data);
  };

  if (categories.length === 0) return <></>;

  return (
    <section id="categories" className="space-y-6">
      <h2 className="text-3xl font-bold gradient-title">Categories</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CategoryPreview
          isCreateNew={true}
          onCreateNew={() => setIsCategoryDialogOpen(true)}
        />
        {entriesByCategory?.unorganized?.length > 0 && (
          <CategoryPreview
            name="Unorganized"
            entries={entriesByCategory.unorganized}
            isUnorganized={true}
          />
        )}

        {categories?.map((c) => (
          <CategoryPreview
            key={c.id}
            id={c.id}
            name={c.name}
            entries={entriesByCategory[c.id] || []}
          />
        ))}

        <CategoryForm
          loading={createCategoriesLoading}
          onSuccess={handleCreateCategory}
          open={isCategoryDialogOpen}
          setOpen={setIsCategoryDialogOpen}
        />
      </div>
    </section>
  );
};

export default Categories;
