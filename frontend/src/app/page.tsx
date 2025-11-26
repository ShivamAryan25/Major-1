"use client";

import FeatureCard from "@/components/FeatureCard";
import {
  MessageSquare,
  BarChart3,
  Brain,
  Volume2,
  Moon,
  Wind,
  ScanSearch,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "Talk to Me",
      subtitle: "Have meaningful conversations",
      href: "/chatbot",
    },
    {
      icon: ScanSearch,
      title: "Discover More",
      subtitle: "Fetch top research links for your content",
      href: "/sentiment-analysis",
    },
    {
      icon: Brain,
      title: "Well-Being Assessment",
      subtitle: "Assess your mental wellness",
      href: "/depression-analysis",
    },
    {
      icon: Volume2,
      title: "Listen to Your Mood",
      subtitle: "Express yourself through your voice",
      href: "/voice-emotion",
    },
    {
      icon: Moon,
      title: "Rest",
      subtitle: "Embrace calm and restoration",
      href: "/rest",
    },
    {
      icon: Wind,
      title: "Mental-Wellness Game",
      subtitle: "Flow with intention and ease",
      href: "/breathe-test",
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
