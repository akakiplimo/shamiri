import { getCategory } from '@/actions/category';
import { getJournalEntries } from '@/actions/journal';
import React from 'react';
import DeleteCategoryDialog from '../_components/delete-category';
import JournalFilters from '../_components/journal-filters';

const CategoryPage = async ({ params }) => {
  const { categoryId } = params;

  const entries = await getJournalEntries({ categoryId });

  const category = await getCategory(categoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between">
        <div className="flex justify-between">
          <h1 className="text-4xl font-bold gradient-title">
            {categoryId === 'unorganized'
              ? 'Unorganized Entries'
              : category?.name || 'Category'}
          </h1>
          {category && (
            <DeleteCategoryDialog
              category={category}
              entriesCount={entries?.data?.entries.length}
            />
          )}
        </div>
        {category?.description && (
          <h2 className="font-extralight pl-1">{category?.description}</h2>
        )}
      </div>

      {/* Render Entries */}
      <JournalFilters entries={entries.data.entries} />
    </div>
  );
};

export default CategoryPage;
