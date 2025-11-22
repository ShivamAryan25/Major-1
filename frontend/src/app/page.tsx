"use client";

import FeatureCard from "@/components/FeatureCard";
import { MessageSquare, BarChart3, Brain, Sun, Moon, Wind } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "Chatbot",
      subtitle: "Have meaningful conversations",
      href: "/chatbot",
    },
    {
      icon: BarChart3,
      title: "Sentiment Analysis",
      subtitle: "Understand your emotional patterns",
      href: "/sentiment-analysis",
    },
    {
      icon: Brain,
      title: "Depression Analysis",
      subtitle: "Assess your mental wellness",
      href: "/depression-analysis",
    },
    {
      icon: Sun,
      title: "Energy",
      subtitle: "Recharge and revitalize yourself",
    },
    {
      icon: Moon,
      title: "Rest",
      subtitle: "Embrace calm and restoration",
    },
    {
      icon: Wind,
      title: "Breathe",
      subtitle: "Flow with intention and ease",
    },
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* Main content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Heading Section */}
        <div className="text-center mb-16 space-y-3">
          <h1 className="text-5xl md:text-6xl font-light text-[#3A4F3A] tracking-tight leading-tight">
            What would you like to explore today?
          </h1>
          <p className="text-lg font-light text-[#6B8E6B] tracking-wide">
            Choose a space that feels right for you.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              subtitle={feature.subtitle}
              href={feature.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
