export function Badge({ children, variant }) {
  const color = variant === "success" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
} 