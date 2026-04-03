export type OnboardingResponses = {
  intrusiveThoughts: number;
  compulsions: number;
  distress: number;
  selectedTypes: string[];
  frequency: number;
  interference: number;
  resistanceDifficulty: number;
  timeSpent: number;
  priorTherapy: string;
  openToERP: boolean;
  wantsTherapist: boolean;
};

function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please sign in to continue.");
  }
  return token;
}

export async function getOnboardingStatus() {
  const token = getToken();
  const response = await fetch("/api/onboarding", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to load onboarding status");
  }

  return response.json();
}

export async function submitOnboarding(responses: OnboardingResponses) {
  const token = getToken();
  const response = await fetch("/api/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ responses }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to submit onboarding");
  }

  return response.json();
}

export async function getTherapistRecommendations() {
  const token = getToken();
  const response = await fetch("/api/therapists/recommendation", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to load recommendations");
  }

  return response.json();
}
