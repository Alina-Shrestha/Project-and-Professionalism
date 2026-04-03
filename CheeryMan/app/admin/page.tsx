"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Therapist = {
  _id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  contact: string;
  city?: string;
  active: boolean;
};

type TherapistForm = {
  name: string;
  specialization: string;
  experienceYears: number;
  contact: string;
  city: string;
};

const INITIAL_FORM: TherapistForm = {
  name: "",
  specialization: "OCD",
  experienceYears: 5,
  contact: "",
  city: "",
};

export default function AdminPage() {
  const [form, setForm] = useState<TherapistForm>(INITIAL_FORM);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const fetchTherapists = async () => {
    if (!token) {
      setStatus("Please sign in to manage therapists.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/therapists?includeInactive=true", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setTherapists([]);
      if (res.status === 403) {
        setStatus("Only admins can manage therapists.");
      } else {
        setStatus("Failed to load therapists.");
      }
      setLoading(false);
      return;
    }

    const data = await res.json();
    setTherapists(Array.isArray(data?.data) ? data.data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const saveTherapist = async () => {
    if (!token) {
      setStatus("Please sign in to continue.");
      return;
    }

    setSaving(true);

    const endpoint = editingId ? `/api/therapists/${editingId}` : "/api/therapists";
    const method = editingId ? "PUT" : "POST";

    const token = localStorage.getItem("token");
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus(editingId ? "Therapist updated" : "Therapist added");
      resetForm();
      await fetchTherapists();
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus(body?.message || body?.error || "Failed to save therapist");
    }

    setSaving(false);
  };

  const editTherapist = (therapist: Therapist) => {
    setEditingId(therapist._id);
    setForm({
      name: therapist.name,
      specialization: therapist.specialization,
      experienceYears: therapist.experienceYears,
      contact: therapist.contact,
      city: therapist.city || "",
    });
    setStatus("");
  };

  const toggleTherapistStatus = async (therapist: Therapist) => {
    if (!token) return;
    const res = await fetch(`/api/therapists/${therapist._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: !therapist.active }),
    });

    if (res.ok) {
      setStatus(`Therapist ${therapist.active ? "deactivated" : "activated"}`);
      await fetchTherapists();
    } else {
      setStatus("Failed to update therapist status");
    }
  };

  const deleteTherapist = async (therapistId: string) => {
    if (!token) return;
    const res = await fetch(`/api/therapists/${therapistId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setStatus("Therapist deleted");
      if (editingId === therapistId) {
        resetForm();
      }
      await fetchTherapists();
    } else {
      setStatus("Failed to delete therapist");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="text-muted-foreground">Manage therapist directory and content inputs.</p>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Therapist" : "Add Therapist"}
        </h2>
        <Input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
        />
        <Input
          value={form.specialization}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, specialization: e.target.value }))
          }
          placeholder="Specialization"
        />
        <Input
          value={form.experienceYears}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              experienceYears: Number(e.target.value) || 0,
            }))
          }
          placeholder="Experience years"
          type="number"
        />
        <Input
          value={form.contact}
          onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
          placeholder="Contact"
        />
        <Input
          value={form.city}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="City"
        />
        <div className="flex gap-2">
          <Button onClick={saveTherapist} disabled={saving}>
            {saving ? "Saving..." : "Save Therapist"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={resetForm}>
              Cancel Edit
            </Button>
          ) : null}
        </div>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-xl font-semibold">Manage Therapists</h2>

        {loading ? <p className="text-sm text-muted-foreground">Loading therapists...</p> : null}

        {!loading && therapists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No therapists found.</p>
        ) : null}

        <div className="space-y-2">
          {therapists.map((therapist) => (
            <div
              key={therapist._id}
              className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{therapist.name}</p>
                <p className="text-sm text-muted-foreground">
                  {therapist.specialization} | {therapist.experienceYears} years | {therapist.city || "N/A"} | {therapist.active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => editTherapist(therapist)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleTherapistStatus(therapist)}
                >
                  {therapist.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteTherapist(therapist._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
