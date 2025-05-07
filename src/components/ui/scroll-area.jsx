export function ScrollArea({ children, className }) {
  return (
    <div className={className} style={{ overflowY: 'auto' }}>
      {children}
    </div>
  );
} 