import { type BroadcastJobSummary } from "@/types";
import { AdminHistoryTableHead } from "./AdminHistoryTable/AdminHistoryTableHead";
import { AdminHistoryTableBody } from "./AdminHistoryTable/AdminHistoryTableBody";
import { AdminHistoryTablePagination } from "./AdminHistoryTable/AdminHistoryTablePagination";

interface AdminHistoryTableProps {
  items: BroadcastJobSummary[];
  loading: boolean;
  page: number;
  totalPages: number;
  onSelectItem: (itemId: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

/**
 * Displays paginated admin broadcast history in a table.
 * @param props - Table data and pagination callbacks.
 * @returns A history table with previous and next controls.
 */
export const AdminHistoryTable = (props: AdminHistoryTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <AdminHistoryTableHead />
        <AdminHistoryTableBody
          items={props.items}
          loading={props.loading}
          onSelectItem={props.onSelectItem}
        />
      </table>
      <AdminHistoryTablePagination
        page={props.page}
        totalPages={props.totalPages}
        loading={props.loading}
        onPreviousPage={props.onPreviousPage}
        onNextPage={props.onNextPage}
      />
    </div>
  );
};
