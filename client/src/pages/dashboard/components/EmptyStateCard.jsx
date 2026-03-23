export function EmptyStateCard({ title, body }) {
  return (
    <div className="subtle-card rounded-[24px] p-5">
      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{body}</p>
    </div>
  );
}
