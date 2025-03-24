import { getCategories } from '@/actions/category';
import { getJournalEntries } from '@/actions/journal';
import { log } from 'console';
import React from 'react';
import Categories from './components/categories';

const Dashboard = async () => {
  const categories = await getCategories();
  const entriesData = await getJournalEntries();

  const entriesByCategory = entriesData?.data.entries.reduce((acc, entry) => {
    const categoryId = entry.categoryId || 'unorganized';

    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(entry);
    return acc;
  }, {});

  log(entriesByCategory);

  return (
    <div className="px-4 py-8 space-y-8">
      <section className="space-y-4">{/* Mood Analytics */}</section>

      <Categories
        categories={categories}
        entriesByCategory={entriesByCategory}
      />
    </div>
  );
};

export default Dashboard;
