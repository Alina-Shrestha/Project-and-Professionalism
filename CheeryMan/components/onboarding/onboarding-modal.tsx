"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOnboardingStatus,
  submitOnboarding,
  type OnboardingResponses,
} from "@/lib/api/onboarding";

type Props = {
  onCompleted?: () => void;
  manualOpenTrigger?: number;
};

const TYPE_OPTIONS = [
  { key: "contamination", label: "Contamination / Cleaning" },
  { key: "checking", label: "Checking / Rechecking" },
  { key: "symmetry", label: "Symmetry / Just-right" },
  { key: "intrusive", label: "Intrusive Thoughts" },
  { key: "mental-rituals", label: "Mental Rituals" },
  { key: "hoarding", label: "Hoarding Tendencies" },
];

const SCALE_LABELS = [
  "Never",
  "A few days",
  "Over half the days",
  "Nearly every day",
];

const TIME_LABELS = [
  "< 1 hour/day",
  "1-3 hours/day",
  "3-8 hours/day",
  "Most of the day",
];

export function OnboardingModal({ onCompleted, manualOpenTrigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [responses, setResponses] = useState<OnboardingResponses>({
    intrusiveThoughts: 1,
    compulsions: 1,
    distress: 1,
    selectedTypes: [],
    frequency: 1,
    interference: 1,
    resistanceDifficulty: 1,
    timeSpent: 1,
    priorTherapy: "none",
    openToERP: true,
    wantsTherapist: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingStatus(false);
          return;
        }

        const status = await getOnboardingStatus();
        setOpen(!status.completed);
      } catch {
        setOpen(false);
      } finally {
        setLoadingStatus(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!loadingStatus && typeof manualOpenTrigger === "number" && manualOpenTrigger > 0) {
      setOpen(true);
    }
  }, [manualOpenTrigger, loadingStatus]);

  const canSubmit = useMemo(() => responses.selectedTypes.length > 0, [responses]);

  const updateScale = (field: keyof OnboardingResponses, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleType = (key: string) => {
    setResponses((prev) => {
      if (prev.selectedTypes.includes(key)) {
        return {
          ...prev,
          selectedTypes: prev.selectedTypes.filter((item) => item !== key),
        };
      }
      return {
        ...prev,
        selectedTypes: [...prev.selectedTypes, key].slice(0, 3),
      };
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!canSubmit) {
      setError("Select at least one symptom pattern to continue.");
      return;
    }

    try {
      setSubmitting(true);
      await submitOnboarding(responses);
      setOpen(false);
      onCompleted?.();
      if (responses.wantsTherapist) {
        router.push("/therapists");
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save onboarding responses";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome. Let us personalize your support.</DialogTitle>
          <DialogDescription>
            This short screening helps tailor your dashboard. It does not provide a clinical diagnosis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Awareness
            </h3>
            <div className="space-y-2">
              <label className="text-sm">How often do intrusive thoughts bother you?</label>
              <select
                className="w-full rounded-md border bg-background p-2"
                value={responses.intrusiveThoughts}
                onChange={(e) => updateScale("intrusiveThoughts", Number(e.target.value))}
              >
                {SCALE_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">How often do compulsive urges occur?</label>
              <select
                className="w-full rounded-md border bg-background p-2"
                value={responses.compulsions}
                onChange={(e) => updateScale("compulsions", Number(e.target.value))}
              >
                {SCALE_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">How much distress do these symptoms cause?</label>
              <select
                className="w-full rounded-md border bg-background p-2"
                value={responses.distress}
                onChange={(e) => updateScale("distress", Number(e.target.value))}
              >
                {SCALE_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Type Identification
            </h3>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => {
                const active = responses.selectedTypes.includes(option.key);
                return (
                  <Button
                    key={option.key}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleType(option.key)}
                    className="rounded-full"
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Select up to 3 patterns that feel most relevant.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Severity And Impact
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm">Frequency</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={responses.frequency}
                  onChange={(e) => updateScale("frequency", Number(e.target.value))}
                >
                  {SCALE_LABELS.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Interference in daily life</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={responses.interference}
                  onChange={(e) => updateScale("interference", Number(e.target.value))}
                >
                  {SCALE_LABELS.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Difficulty resisting compulsions</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={responses.resistanceDifficulty}
                  onChange={(e) => updateScale("resistanceDifficulty", Number(e.target.value))}
                >
                  {SCALE_LABELS.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Time spent on symptoms</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={responses.timeSpent}
                  onChange={(e) => updateScale("timeSpent", Number(e.target.value))}
                >
                  {TIME_LABELS.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Help And Readiness
            </h3>
            <div className="space-y-2">
              <label className="text-sm">Have you previously received therapy support?</label>
              <select
                className="w-full rounded-md border bg-background p-2"
                value={responses.priorTherapy}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    priorTherapy: e.target.value,
                  }))
                }
              >
                <option value="none">No prior therapy</option>
                <option value="self-help">Self-help only</option>
                <option value="therapy">Therapy or counseling</option>
                <option value="medication">Medication</option>
                <option value="both">Therapy and medication</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant={responses.openToERP ? "default" : "outline"}
                onClick={() =>
                  setResponses((prev) => ({
                    ...prev,
                    openToERP: !prev.openToERP,
                  }))
                }
              >
                {responses.openToERP ? "Open to ERP exercises" : "Not open to ERP yet"}
              </Button>
              <Button
                type="button"
                variant={responses.wantsTherapist ? "default" : "outline"}
                onClick={() =>
                  setResponses((prev) => ({
                    ...prev,
                    wantsTherapist: !prev.wantsTherapist,
                  }))
                }
              >
                {responses.wantsTherapist
                  ? "Yes, suggest therapists"
                  : "No therapist suggestion now"}
              </Button>
            </div>
          </section>

          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{error}</p>
              {error.toLowerCase().includes("sign in") ? (
                <Button type="button" variant="outline" onClick={() => router.push("/login")}>
                  Go to Sign In
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save and Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
