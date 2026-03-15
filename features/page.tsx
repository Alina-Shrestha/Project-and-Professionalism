"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Cpu,
  Lock,
  Activity,
  AlertCircle,
  Server,
  BarChart2,
  Shield,
} from "lucide-react";
import { LucideProps } from "lucide-react";

const Lotus = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 2C10 6 4 8 4 12c0 2 2 4 8 10 6-6 8-8 8-10 0-4-6-6-8-10z" />
  </svg>
);

const features = [
  {
    icon: <Cpu className="w-10 h-10 text-primary" />,
    title: "AI-Powered Therapy",
    description:
      "24/7 access to empathetic AI agents trained in various therapeutic approaches.",
  },
  {
    icon: <Lock className="w-10 h-10 text-primary" />,
    title: "Blockchain Security",
    description:
      "Your therapy sessions are secured by blockchain technology.",
  },
  {
    icon: <Activity className="w-10 h-10 text-primary" />,
    title: "Smart Analysis",
    description:
      "Advanced NLP and emotion detection for better understanding.",
  },
  {
    icon: <AlertCircle className="w-10 h-10 text-primary" />,
    title: "Crisis Detection",
    description:
      "Real-time monitoring and emergency response protocols.",
  },
  {
    icon: <Server className="w-10 h-10 text-primary" />,
    title: "IoT Integration",
    description:
      "Smart environment integration for wellness.",
  },
  {
    icon: <BarChart2 className="w-10 h-10 text-primary" />,
    title: "Progress Tracking",
    description:
      "Analytics and insights for your mental health journey.",
  },
  {
    icon: <Shield className="w-10 h-10 text-primary" />,
    title: "Privacy First",
    description:
      "End-to-end encryption and zero-knowledge privacy.",
  },
  {
    icon: <Lotus className="w-10 h-10 text-primary" />,
    title: "Holistic Care",
    description:
      "Wearables and provider integration.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            {f.icon}
            <h3 className="text-xl font-semibold mt-4">{f.title}</h3>
            <p className="text-muted-foreground">{f.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
