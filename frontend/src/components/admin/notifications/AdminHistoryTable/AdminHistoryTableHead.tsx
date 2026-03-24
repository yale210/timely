/**
 * Renders the table head for the admin broadcast history table.
 * @returns A table head component.
 */
export const AdminHistoryTableHead = () => (
  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
    <tr>
      <th className="px-4 py-3">Title</th>
      <th className="px-4 py-3">Audience</th>
      <th className="px-4 py-3">Sender</th>
      <th className="px-4 py-3">Status</th>
      <th className="px-4 py-3">Queued</th>
    </tr>
  </thead>
);
