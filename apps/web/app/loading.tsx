/** Route-level loading indicator (button-level actions use spinners; page/content
 * loads use this / skeletons — see the guide's loading-state rule). */
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
