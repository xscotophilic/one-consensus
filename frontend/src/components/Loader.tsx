interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Loader({
  size = 'md',
  className = ""
}: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-indigo-500 border-t-transparent`}></div>
    </div>
  );
}
