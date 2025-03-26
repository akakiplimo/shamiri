'use client';

import { deleteCategory } from '@/actions/category';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const DeleteCategoryDialog = ({ category, entriesCount = 0 }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    loading: isDeleting,
    fn: deleteCategoryFn,
    data: deletedCategory,
  } = useFetch(deleteCategory);

  useEffect(() => {
    if (deletedCategory && !isDeleting) {
      setOpen(false);
      toast.error(
        `Category "${category?.name}" and all its entries deleted successfully`
      );
      router.push('/dashboard');
    }
  }, [deletedCategory, isDeleting]);

  const handleDelete = () => {
    deleteCategoryFn(category.id);
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &quot;{category.name}&quot;?
          </AlertDialogTitle>
          <div className="space-y-2 text-muted-foreground text-sm">
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside">
              <li>The category &quot;{category.name}&quot;</li>
              <li>
                {entriesCount} journal {entriesCount == 1 ? 'entry' : 'entries'}{' '}
              </li>
            </ul>
            <p className="font-semibold text-red-600">
              This action cannot be undone
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Category'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCategoryDialog;
