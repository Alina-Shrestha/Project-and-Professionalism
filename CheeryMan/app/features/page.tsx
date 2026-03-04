"use client";

import { motion } from "framer-motion";
import { Sun, Leaf, Heart, Smile, Water, Star, Moon } from "lucide-react";

// Custom Lotus icon
const Lotus = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C10 6 4 8 4 12c0 2 2 4 8 10 6-6 8-8 8-10 0-4-6-6-8-10z" />
  </svg>
);

// Features for mindfulness app
const features = [
  { icon: <Sun className="w-12 h-12 text-yellow-400" />, title: "Morning Mindfulness" },
  { icon: <Leaf className="w-12 h-12 text-green-400" />, title: "Nature Integration" },
  { icon: <Heart className="w-12 h-12 text-red-400" />, title: "Emotional Check-ins" },
  { icon: <Smile className="w-12 h-12 text-pink-400" />, title: "Mindful Activities" },
  { icon: <Water className="w-12 h-12 text-blue-400" />, title: "Ocean Sounds" },
  { icon: <Star className="w-12 h-12 text-purple-400" />, title: "Night Meditation" },
  { icon: <Moon className="w-12 h-12 text-indigo-400" />, title: "Evening Reflection" },
  { icon: <Lotus className="w-12 h-12 text-teal-400" />, title: "Holistic Growth" },
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 via-teal-50 to-white flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
      <h2 className="text-3xl font-semibold text-gray-800 mb-16 text-center">Mindfulness Features</h2>
      
      <div className="relative w-full max-w-6xl flex flex-wrap justify-center gap-12">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [0, -10, 0], opacity: 1 }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center w-36 h-36 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-md"
          >
            {f.icon}
            <span className="mt-3 text-center text-gray-700 font-medium">{f.title}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}