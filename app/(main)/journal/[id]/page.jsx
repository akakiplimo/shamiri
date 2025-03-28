import { getJournalEntry } from '@/actions/journal';
import { format } from 'date-fns';
import Image from 'next/image';
import React from 'react';
import EditButton from './_components/edit-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import DeleteEntryDialog from './_components/delete-entry';
import AskAI from './_components/ask-ai';

const JournalEntryPage = async ({ params }) => {
  const { id } = params;
  const {
    data: { entry },
  } = await getJournalEntry(id);

  return (
    <>
      {entry.moodImageUrl && (
        <div className="relative h-48 md:h-64 w-full">
          <Image
            src={entry.moodImageUrl}
            alt="Mood Image"
            className="object-contain rounded-md"
            fill
            priority
          />
        </div>
      )}
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-5xl font-bold gradient-title">
                {entry.title}
              </h1>
              <p className="text-gray-500">
                Created {format(new Date(entry.createdAt), 'PPP')}
              </p>
            </div>
            <div className="space-x-4">
              {/* Ask AI Button */}
              <AskAI entryId={id} />
              <EditButton entryId={id} />
              <DeleteEntryDialog entryId={id} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.category && (
              <Link href={`/category/${entry.category.id}`}>
                <Badge>Category: {entry.category.name}</Badge>
              </Link>
            )}

            <Badge
              variant="outline"
              style={{
                backgroundColor: `var(--${entry.moodData.color}-50) !important`,
                color: `var(--${entry.moodData.color}-700) !important`,
                borderColor: `var(--${entry.moodData.color}-200) !important`,
              }}
            >
              Feeling {entry.moodData.label}
            </Badge>
          </div>
        </div>

        <hr />

        <div className="ql-snow">
          <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        </div>

        <div className="text-sm text-gray-500 pt-4 border-t">
          Last updated {format(new Date(entry.updatedAt), "PPP 'at' p")}
        </div>
      </div>
    </>
  );
};

export default JournalEntryPage;
