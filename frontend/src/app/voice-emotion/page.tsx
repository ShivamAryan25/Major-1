"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Mic, Square, Loader2, Volume2 } from "lucide-react";
import Link from "next/link";

interface EmotionProbability {
  emotion: string;
  emoji: string;
  probability: number;
}

interface VoiceEmotionResult {
  emotion: string;
  emoji: string;
  description: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  top_emotions: EmotionProbability[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VoiceEmotionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VoiceEmotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 22050,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      // Try to use audio/webm or audio/ogg codec
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
        if (!MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/mp4' };
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Unable to access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const analyzeEmotion = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      // Determine file extension based on blob type
      let filename = "recording.webm";
      if (audioBlob.type.includes("ogg")) {
        filename = "recording.ogg";
      } else if (audioBlob.type.includes("mp4")) {
        filename = "recording.mp4";
      }
      
      formData.append("audio", audioBlob, filename);

      const response = await fetch(`${API_BASE_URL}/predict-voice-emotion`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze audio");
      }

      const data: VoiceEmotionResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error analyzing emotion:", err);
      setError(err instanceof Error ? err.message : "Sorry, we couldn't analyze your voice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setResult(null);
    setError(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "text-yellow-600",
      sad: "text-blue-600",
      angry: "text-red-600",
      fearful: "text-purple-600",
      surprised: "text-pink-600",
      calm: "text-green-600",
      neutral: "text-gray-600",
      disgust: "text-orange-600",
    };
    return colors[emotion] || "text-gray-600";
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
      <div className="relative z-10 w-full max-w-3xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="w-20 h-20 bg-[#b8d4c6] rounded-full flex items-center justify-center mx-auto mb-6">
            <Volume2 className="w-10 h-10 text-[#6b7d72]" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-light text-[#3A4F3A] tracking-tight leading-tight">
            Voice Emotion Detector
          </h1>
          <p className="text-lg font-light text-[#6B8E6B] tracking-wide">
            Express yourself and discover the emotion in your voice
          </p>
        </div>

        {/* Recording Interface */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm mb-8">
          {!audioBlob ? (
            <div className="text-center space-y-6">
              {/* Recording Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-[#b8d4c6] hover:bg-[#a8c4b6] hover:scale-105"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-[#2A3F2A]" />
                  )}
                </button>

                {isRecording && (
                  <div className="text-2xl font-light text-[#3A4F3A]">
                    {formatTime(recordingTime)}
                  </div>
                )}

                <p className="text-[#6B8E6B] font-light">
                  {isRecording
                    ? "Recording... Click to stop"
                    : "Click to start recording"}
                </p>
              </div>

              {/* Instructions */}
              {!isRecording && (
                <div className="bg-blue-50/70 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mt-6">
                  <p className="text-sm text-blue-900 font-light">
                    💡 <strong>Tip:</strong> Speak naturally for 3-5 seconds
                    for best results. Express how you&apos;re feeling!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recorded Audio Info */}
              <div className="text-center">
                <div className="w-16 h-16 bg-[#b8d4c6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-[#2A3F2A]" />
                </div>
                <p className="text-[#3A4F3A] font-light">
                  Recording captured ({formatTime(recordingTime)})
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={analyzeEmotion}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-[#b8d4c6] hover:bg-[#a8c4b6] text-[#2A3F2A] rounded-full transition-all duration-200 font-light shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Analyze Emotion</span>
                  )}
                </button>
                <button
                  onClick={resetRecording}
                  disabled={isProcessing}
                  className="px-6 py-4 bg-white/70 hover:bg-white text-[#3A4F3A] rounded-full transition-all duration-200 font-light shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50/70 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-800 font-light text-center">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Emotion Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm text-center">
              <div className="text-8xl mb-4">{result.emoji}</div>
              <h2
                className={`text-4xl font-light mb-2 capitalize ${getEmotionColor(
                  result.emotion
                )}`}
              >
                {result.emotion}
              </h2>
              <p className="text-lg text-[#6B8E6B] font-light mb-4">
                {result.description}
              </p>
              <div className="text-3xl font-light text-[#3A4F3A]">
                {result.confidence.toFixed(1)}%
              </div>
              <p className="text-sm text-[#6B8E6B] font-light">Confidence</p>
            </div>

            {/* Top 3 Emotions */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl text-[#3A4F3A] font-light mb-6 text-center">
                Emotion Breakdown
              </h3>
              <div className="space-y-4">
                {result.top_emotions.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="text-3xl">{item.emoji}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#3A4F3A] font-light capitalize">
                          {item.emotion}
                        </span>
                        <span className="text-[#6B8E6B] font-light text-sm">
                          {item.probability.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#b8d4c6]/30 rounded-full h-2">
                        <div
                          className="bg-[#b8d4c6] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Try Again Button */}
            <button
              onClick={resetRecording}
              className="w-full py-4 bg-white/70 hover:bg-white text-[#3A4F3A] rounded-full transition-all duration-200 font-light shadow-md hover:shadow-lg"
            >
              Try Another Recording
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

