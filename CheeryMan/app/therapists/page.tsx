"use client";

import { useEffect, useMemo, useState } from "react";

interface Therapist {
  _id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  contact: string;
  city?: string;
}

interface RecommendationSummary {
  riskScore: number;
  severityLevel: "low" | "moderate" | "high";
  urgency: "routine" | "soon" | "priority";
  reasons: string[];
  suggestedSpecializations: string[];
}

const GUEST_FALLBACK_THERAPISTS: Therapist[] = [
  {
    _id: "guest-fallback-1",
    name: "Dr. Asha Verma",
    specialization: "OCD, ERP, CBT",
    experienceYears: 11,
    contact: "contact@mindcare.example",
    city: "Remote",
  },
  {
    _id: "guest-fallback-2",
    name: "Dr. Rohan Khadka",
    specialization: "OCD, Anxiety, Exposure Therapy",
    experienceYears: 9,
    contact: "care@serenityclinic.example",
    city: "Kathmandu",
  },
  {
    _id: "guest-fallback-3",
    name: "Dr. Mira Shrestha",
    specialization: "ERP, Intrusive Thoughts, CBT",
    experienceYears: 8,
    contact: "help@calmbridge.example",
    city: "Pokhara",
  },
];

export default function TherapistsPage() {
  const [list, setList] = useState<Therapist[]>([]);
  const [recommended, setRecommended] = useState<Therapist[]>([]);
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [dataSource, setDataSource] = useState<"directory" | "fallback">("directory");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setRecommended(GUEST_FALLBACK_THERAPISTS);
        setDataSource("fallback");
        setNotice("You are browsing as a guest. Sign in to unlock personalized therapist recommendations.");
        return;
      }

      const res = await fetch("/api/therapists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data?.data) ? data.data : []);
      }

      const recRes = await fetch("/api/therapists/recommendation", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommended(Array.isArray(recData?.data) ? recData.data : []);
        setSummary(recData?.summary || null);
        setDataSource(recData?.dataSource === "fallback" ? "fallback" : "directory");
        setNotice("");
      } else {
        setRecommended(GUEST_FALLBACK_THERAPISTS);
        setSummary(null);
        setDataSource("fallback");

        if (recRes.status === 400) {
          setNotice("Complete onboarding to get personalized therapist recommendations. Showing general suggestions for now.");
        } else if (recRes.status === 401) {
          setNotice("Your session expired. Please sign in again for personalized recommendations.");
        } else {
          setNotice("Could not load personalized recommendations right now. Showing general suggestions.");
        }
      }
    };

    load();
  }, []);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    [...recommended, ...list].forEach((item) => {
      if (item.city && item.city.trim()) {
        cities.add(item.city.trim());
      }
    });
    return ["all", ...Array.from(cities).sort((a, b) => a.localeCompare(b))];
  }, [recommended, list]);

  const availableSpecializations = useMemo(() => {
    const specs = new Set<string>();
    [...recommended, ...list].forEach((item) => {
      if (item.specialization && item.specialization.trim()) {
        specs.add(item.specialization.trim());
      }
    });
    return ["all", ...Array.from(specs).sort((a, b) => a.localeCompare(b))];
  }, [recommended, list]);

  const applyFilters = (therapists: Therapist[]) => {
    const searchText = search.trim().toLowerCase();
    return therapists.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.name.toLowerCase().includes(searchText) ||
        item.specialization.toLowerCase().includes(searchText) ||
        (item.city || "").toLowerCase().includes(searchText);

      const matchesCity = cityFilter === "all" || (item.city || "") === cityFilter;
      const matchesSpecialization =
        specializationFilter === "all" || item.specialization === specializationFilter;

      return matchesSearch && matchesCity && matchesSpecialization;
    });
  };

  const filteredRecommended = useMemo(
    () => applyFilters(recommended),
    [recommended, search, cityFilter, specializationFilter]
  );
  const filteredList = useMemo(
    () => applyFilters(list),
    [list, search, cityFilter, specializationFilter]
  );

  const exportSummary = () => {
    if (!summary) return;

    const lines = [
      "CheeryMan Therapist Recommendation Summary",
      `Generated at: ${new Date().toLocaleString()}`,
      "",
      `Severity Level: ${summary.severityLevel}`,
      `Urgency: ${summary.urgency}`,
      `Risk Score: ${Math.round(summary.riskScore * 100)}%`,
      `Recommendation Source: ${dataSource === "fallback" ? "Demo/Fallback" : "Directory"}`,
      "",
      "Suggested Focus Areas:",
      ...summary.suggestedSpecializations.map((item) => `- ${item}`),
      "",
      "Key Reasons:",
      ...(summary.reasons.length
        ? summary.reasons.map((reason) => `- ${reason}`)
        : ["- No critical pattern detected."]),
      "",
      "Top Suggested Therapists:",
      ...filteredRecommended.slice(0, 5).map(
        (item) =>
          `- ${item.name} | ${item.specialization} | ${item.experienceYears} years | ${item.city || "N/A"}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cheeryman-therapist-summary.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <h1 className="text-3xl font-bold">Therapist Suggestions</h1>
      <p className="text-muted-foreground">
        If symptoms are severe or persistent, consider professional support.
      </p>

      {notice ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          {notice}
        </div>
      ) : null}

      <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
        <p className="text-sm font-semibold">Find a Therapist</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, focus"
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city === "all" ? "All cities" : city}
              </option>
            ))}
          </select>
          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {availableSpecializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec === "all" ? "All specializations" : spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary ? (
        <div className="rounded-xl border p-4 bg-muted/30 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Personalized Recommendation Insight</p>
            <span className="text-xs rounded-full border px-2 py-0.5">
              {dataSource === "fallback" ? "Demo/Fallback Data" : "Live Directory Data"}
            </span>
          </div>
          <p className="text-sm">
            Severity: <span className="font-medium capitalize">{summary.severityLevel}</span> | Urgency: <span className="font-medium capitalize">{summary.urgency}</span> | Risk score: <span className="font-medium">{Math.round(summary.riskScore * 100)}%</span>
          </p>
          {summary.reasons?.length ? (
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              {summary.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="mt-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-background"
            onClick={exportSummary}
          >
            Export Summary
          </button>
        </div>
      ) : null}

      {filteredRecommended.length ? (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Recommended For You</h2>
          <div className="grid gap-3">
            {filteredRecommended.map((t) => (
              <div key={t._id} className="rounded-xl border p-4 bg-primary/5">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.specialization}</p>
                <p className="text-sm">Experience: {t.experienceYears} years</p>
                <p className="text-sm">Contact: {t.contact}</p>
                {t.city ? <p className="text-sm">City: {t.city}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        {filteredList.map((t) => (
          <div key={t._id} className="rounded-xl border p-4">
            <p className="font-semibold">{t.name}</p>
            <p className="text-sm text-muted-foreground">{t.specialization}</p>
            <p className="text-sm">Experience: {t.experienceYears} years</p>
            <p className="text-sm">Contact: {t.contact}</p>
            {t.city ? <p className="text-sm">City: {t.city}</p> : null}
          </div>
        ))}
        {!filteredRecommended.length && !filteredList.length ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No therapists match your current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
