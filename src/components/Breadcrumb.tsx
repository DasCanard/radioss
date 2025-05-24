import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index === 0 && <Home size={16} className="breadcrumb-home-icon" />}
            {item.onClick ? (
              <button className="breadcrumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRight size={16} className="breadcrumb-separator" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 