export function Button({ children, ...props }) {
  return (
    <button
      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
} 