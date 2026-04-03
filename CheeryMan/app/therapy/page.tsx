"use client";

import Link from "next/link";

export default function TherapyPage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Therapy Dashboard</h1>

      <Link href="/chat">
        <button
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Let's Talk
        </button>
      </Link>
    </div>
  );
}
