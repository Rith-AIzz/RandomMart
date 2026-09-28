import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  BookOpen,
  Headphones,
  Lamp,
  Shirt,
  Sparkles,
  Watch,
} from "lucide-react";

const icons = { BookOpen, Headphones, Lamp, Shirt, Sparkles, Watch };

export function CategoryCard({
  category,
}: {
  category: {
    slug: string;
    name: string;
    icon: keyof typeof icons;
    description: string;
  };
}) {
  const Icon = icons[category.icon];
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="category-card"
    >
      <span className="category-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <b>{category.name}</b>
        <small>{category.description}</small>
      </span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
