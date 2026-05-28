/**
 * DataTable.jsx — Lightweight table for admin/data pages
 *
 * Usage:
 *   <DataTable
 *     columns={[{ key: "name", label: "Name" }, { key: "status", label: "Status", render: (v) => <Badge variant={v}>{v}</Badge> }]}
 *     data={rows}
 *     loading={loading}
 *     emptyMessage="No members yet"
 *     onRowClick={(row) => navigate(`/users/${row._id}`)}
 *   />
 */
import Spinner from "../feedback/Spinner";
import EmptyState from "../feedback/EmptyState";
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   columns: Array<{ key: string, label: string, render?: (value, row) => React.ReactNode, className?: string }>,
 *   data: object[],
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   emptyIcon?: string,
 *   onRowClick?: (row: object) => void,
 *   className?: string,
 * }} props
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data yet",
  emptyIcon = "📋",
  onRowClick,
  className,
}) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-cc-soft", className)}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-cc-soft bg-cc-surface-weak">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-muted whitespace-nowrap",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="flex justify-center">
                  <Spinner size="md" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8">
                <EmptyState icon={emptyIcon} title={emptyMessage} className="border-none py-6" />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row._id ?? row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-cc-soft/60 last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-cc-surface-weak"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-cc", col.className)}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
