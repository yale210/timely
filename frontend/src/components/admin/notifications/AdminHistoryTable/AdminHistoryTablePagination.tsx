interface AdminHistoryTablePaginationProps {
  /**
   * Current page number.
   */
  page: number;
  /**
   * Total number of pages available.
   */
  totalPages: number;
  /**
   * Whether history is currently being loaded.
   */
  loading: boolean;
  /**
   * Callback to go to the previous page.
   */
  onPreviousPage: () => void;
  /**
   * Callback to go to the next page.
   */
  onNextPage: () => void;
}

/**
 * Renders pagination controls for the broadcast history table.
 * @param props - Pagination state and change handlers.
 * @returns Pagination UI controls.
 */
export const AdminHistoryTablePagination = (props: AdminHistoryTablePaginationProps) => {
  const { page, totalPages, loading, onPreviousPage, onNextPage } = props;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <p className="text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={page === 1 || loading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages || loading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
