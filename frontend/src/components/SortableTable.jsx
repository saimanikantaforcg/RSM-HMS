import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import SkeletonTable from './SkeletonTable';
import EmptyState from './EmptyState';

/**
 * SortableTable — Reusable table with sortable columns, pagination footer,
 * skeleton loading state, and empty state.
 *
 * columns: [{ key, label, render?, align?, sortable? }]
 * rows:    array of data objects
 * page, totalPages, onPageChange: pagination props
 */
export default function SortableTable({
    columns,
    rows,
    loading = false,
    keyField = 'id',
    page = 1,
    totalPages = 1,
    total = 0,
    limit = 20,
    onPageChange,
    onRowClick,
    emptyTitle,
    emptyMessage,
}) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = sortKey
        ? [...rows].sort((a, b) => {
            const va = a[sortKey] ?? '';
            const vb = b[sortKey] ?? '';
            return sortDir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        })
        : rows;

    const colCount = columns.length;

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/60">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 whitespace-nowrap
                    ${col.sortable !== false ? 'cursor-pointer hover:text-neutral-700 select-none' : ''}
                    ${col.align === 'right' ? 'text-right' : ''}`}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.label}
                                        {col.sortable !== false && (
                                            sortKey === col.key
                                                ? sortDir === 'asc'
                                                    ? <ChevronUp size={12} className="text-brand-600" />
                                                    : <ChevronDown size={12} className="text-brand-600" />
                                                : <ChevronsUpDown size={12} className="opacity-30" />
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan={colCount}><SkeletonTable rows={5} cols={colCount} /></td></tr>
                        ) : sorted.length === 0 ? (
                            <tr><td colSpan={colCount}>
                                <EmptyState title={emptyTitle} message={emptyMessage} />
                            </td></tr>
                        ) : (
                            sorted.map(row => (
                                <tr
                                    key={row[keyField]}
                                    onClick={() => onRowClick?.(row)}
                                    className={`border-b border-neutral-50 transition-all
                    ${onRowClick ? 'cursor-pointer hover:bg-brand-50/40 active:bg-brand-100/40' : 'hover:bg-neutral-50/60'}`}
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                                        >
                                            {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {!loading && sorted.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
                    <span className="text-xs font-medium text-neutral-400">
                        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} records
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange?.(page - 1)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >← Prev</button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => onPageChange?.(p)}
                                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${p === page
                                            ? 'bg-brand-600 text-white shadow-sm'
                                            : 'text-neutral-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200'
                                        }`}
                                >{p}</button>
                            );
                        })}
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange?.(page + 1)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
