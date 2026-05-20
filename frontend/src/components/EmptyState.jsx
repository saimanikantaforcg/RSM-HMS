import { ClipboardList } from 'lucide-react';

/**
 * EmptyState — shown when a data list returns no results.
 * @param {string}    title   - e.g. "No Patients Found"
 * @param {string}    message - Descriptive helper text
 * @param {ReactNode} icon    - Optional custom icon (defaults to ClipboardList)
 * @param {ReactNode} action  - Optional CTA button/element
 */
export default function EmptyState({
  title = 'No Records Found',
  message = 'There are no records to display yet.',
  icon,
  action
}) {
  const IconEl = icon ?? <ClipboardList className="h-10 w-10 text-slate-300" />;
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon shadow-soft">
        {IconEl}
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
