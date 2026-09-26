export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="로딩 중"
    />
  );
}
