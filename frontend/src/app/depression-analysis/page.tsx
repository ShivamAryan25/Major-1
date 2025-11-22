"use client";

import { useState } from "react";
import { ArrowLeft, Brain, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Recommendation {
  message: string;
  level: string;
  resources: string[];
}

interface PredictionResponse {
  depression_probability: number;
  prediction_message: string;
  recommendations: Recommendation;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DepressionAnalysisPage() {
  const [formData, setFormData] = useState({
    Age: "",
    Academic_Pressure: "5",
    Study_Satisfaction: "5",
    Work_Study_Hours: "",
    Financial_Stress: "5",
    Sleep_Duration: "7-8 hours",
    Dietary_Habits: "Moderate",
    Suicidal_Thoughts: "No",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        Age: parseInt(formData.Age),
        Academic_Pressure: parseInt(formData.Academic_Pressure),
        Study_Satisfaction: parseInt(formData.Study_Satisfaction),
        Work_Study_Hours: parseInt(formData.Work_Study_Hours),
        Financial_Stress: parseInt(formData.Financial_Stress),
        Sleep_Duration: formData.Sleep_Duration,
        Dietary_Habits: formData.Dietary_Habits,
        Suicidal_Thoughts: formData.Suicidal_Thoughts,
      };

      const response = await fetch(`${API_BASE_URL}/predict-depression`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction from server");
      }

      const data: PredictionResponse = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error making prediction:", error);
      setError("Sorry, we encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-700 bg-green-50";
      case "mild":
        return "text-yellow-700 bg-yellow-50";
      case "moderate":
        return "text-orange-700 bg-orange-50";
      case "high":
        return "text-red-700 bg-red-50";
      case "critical":
        return "text-red-900 bg-red-100";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability <= 20) return "text-green-700";
    if (probability <= 40) return "text-yellow-700";
    if (probability <= 60) return "text-orange-700";
    if (probability <= 80) return "text-red-700";
    return "text-red-900";
  };

  return (
    <div className="relative min-h-screen w-full px-6 py-12 overflow-auto">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3A4F3A] hover:text-[#2A3F2A] transition-colors duration-200 group bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-light">Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="w-20 h-20 bg-[#b8d4c6] rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-[#6b7d72]" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-light text-[#3A4F3A] tracking-tight leading-tight">
            Depression Analysis
          </h1>
          <p className="text-lg font-light text-[#6B8E6B] tracking-wide">
            Understand your mental wellness through personalized assessment
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm space-y-6">
            {/* Age */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="Age"
                value={formData.Age}
                onChange={handleInputChange}
                required
                min="10"
                max="100"
                placeholder="Enter your age"
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] font-light"
              />
            </div>

            {/* Work/Study Hours */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Work/Study Hours per Day <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="Work_Study_Hours"
                value={formData.Work_Study_Hours}
                onChange={handleInputChange}
                required
                min="0"
                max="24"
                placeholder="Enter hours (0-24)"
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] font-light"
              />
            </div>

            {/* Academic Pressure */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Academic Pressure (1-10): {formData.Academic_Pressure}
              </label>
              <input
                type="range"
                name="Academic_Pressure"
                value={formData.Academic_Pressure}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full h-2 bg-[#b8d4c6]/30 rounded-lg appearance-none cursor-pointer accent-[#b8d4c6]"
              />
              <div className="flex justify-between text-xs text-[#6B8E6B] mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Study Satisfaction */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Study Satisfaction (1-10): {formData.Study_Satisfaction}
              </label>
              <input
                type="range"
                name="Study_Satisfaction"
                value={formData.Study_Satisfaction}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full h-2 bg-[#b8d4c6]/30 rounded-lg appearance-none cursor-pointer accent-[#b8d4c6]"
              />
              <div className="flex justify-between text-xs text-[#6B8E6B] mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Financial Stress */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Financial Stress (1-10): {formData.Financial_Stress}
              </label>
              <input
                type="range"
                name="Financial_Stress"
                value={formData.Financial_Stress}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full h-2 bg-[#b8d4c6]/30 rounded-lg appearance-none cursor-pointer accent-[#b8d4c6]"
              />
              <div className="flex justify-between text-xs text-[#6B8E6B] mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Sleep Duration */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Sleep Duration
              </label>
              <select
                name="Sleep_Duration"
                value={formData.Sleep_Duration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] font-light"
              >
                <option value="Less than 5 hours">Less than 5 hours</option>
                <option value="5-6 hours">5-6 hours</option>
                <option value="7-8 hours">7-8 hours</option>
                <option value="More than 8 hours">More than 8 hours</option>
              </select>
            </div>

            {/* Dietary Habits */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Dietary Habits
              </label>
              <select
                name="Dietary_Habits"
                value={formData.Dietary_Habits}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] font-light"
              >
                <option value="Unhealthy">Unhealthy</option>
                <option value="Moderate">Moderate</option>
                <option value="Healthy">Healthy</option>
              </select>
            </div>

            {/* Suicidal Thoughts */}
            <div>
              <label className="block text-[#3A4F3A] font-light mb-2">
                Have you ever had suicidal thoughts?
              </label>
              <select
                name="Suicidal_Thoughts"
                value={formData.Suicidal_Thoughts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] font-light"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#b8d4c6] hover:bg-[#a8c4b6] text-[#2A3F2A] rounded-full transition-all duration-200 font-light shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Get Assessment</span>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="bg-red-50/70 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <p className="text-red-800 font-light">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 mb-12">
            {/* Probability Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm text-center">
              <div className="mb-4">
                <div
                  className={`text-6xl font-light mb-2 ${getProbabilityColor(
                    result.depression_probability
                  )}`}
                >
                  {result.depression_probability.toFixed(2)}%
                </div>
                <p className="text-[#6B8E6B] font-light">
                  Depression Probability
                </p>
              </div>
              <p className="text-[#3A4F3A] font-light">
                {result.prediction_message}
              </p>
            </div>

            {/* Recommendations Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${getLevelColor(
                  result.recommendations.level
                )}`}
              >
                {result.recommendations.level === "low" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-light">
                  {result.recommendations.level.toUpperCase()} RISK
                </span>
              </div>

              <p className="text-lg text-[#3A4F3A] font-light mb-6">
                {result.recommendations.message}
              </p>

              <h3 className="text-xl text-[#3A4F3A] font-light mb-4">
                Recommended Actions:
              </h3>
              <ul className="space-y-3">
                {result.recommendations.resources.map((resource, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[#6B8E6B] font-light"
                  >
                    <span className="w-2 h-2 bg-[#b8d4c6] rounded-full mt-2 flex-shrink-0" />
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50/70 backdrop-blur-sm border border-blue-200 rounded-2xl p-6">
              <p className="text-sm text-blue-900 font-light text-center">
                <strong>Disclaimer:</strong> This assessment is not a medical
                diagnosis. If you&apos;re experiencing mental health concerns,
                please consult a healthcare professional.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

