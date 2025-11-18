"use client"

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href?: string;
}

export default function FeatureCard({ icon: Icon, title, subtitle, href }: FeatureCardProps) {
  const cardContent = (
    <>
      {/* Icon Container */}
      <div className="w-20 h-20 bg-[#b8d4c6] rounded-full flex items-center justify-center mb-6 text-[#6b7d72] group-hover:bg-[#a8c4b6] group-hover:scale-110 transition-all duration-300">
        <Icon className="w-10 h-10" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-normal text-[#4a5568] mb-3">
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-[#718096] text-sm font-light">
        {subtitle}
      </p>
    </>
  );

  const baseClasses = "group relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg hover:bg-white/50 transition-all duration-300 cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={baseClasses}>
      {cardContent}
    </div>
  );
}

