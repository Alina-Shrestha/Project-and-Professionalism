"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  level: string;
}

interface RecordItem {
  _id: string;
  taskTitle: string;
  anxietyBefore: number;
  anxietyAfter: number;
  createdAt: string;
}

export default function ErpPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(3);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/erp", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTasks(data?.data?.tasks || []);
    setRecords(data?.data?.records || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async () => {
    if (!selectedTask) return;
    const token = localStorage.getItem("token");
    await fetch("/api/erp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        anxietyBefore: before,
        anxietyAfter: after,
        notes,
      }),
    });
    setNotes("");
    setBefore(5);
    setAfter(3);
    loadData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <h1 className="text-3xl font-bold">ERP Exercises</h1>

      <div className="grid gap-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            className={`rounded-xl border p-4 text-left ${selectedTask?.id === task.id ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setSelectedTask(task)}
          >
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-muted-foreground">Level: {task.level}</p>
          </button>
        ))}
      </div>

      {selectedTask && (
        <div className="rounded-xl border p-4 space-y-4">
          <p className="font-semibold">Complete: {selectedTask.title}</p>
          <div>
            <p className="text-sm">Anxiety before: {before}/10</p>
            <Slider value={[before]} onValueChange={(v) => setBefore(v[0])} min={0} max={10} step={1} />
          </div>
          <div>
            <p className="text-sm">Anxiety after: {after}/10</p>
            <Slider value={[after]} onValueChange={(v) => setAfter(v[0])} min={0} max={10} step={1} />
          </div>
          <Textarea placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={submit}>Save ERP Record</Button>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Recent ERP Records</h2>
        {records.map((r) => (
          <div key={r._id} className="rounded-xl border p-4">
            <p className="font-medium">{r.taskTitle}</p>
            <p className="text-sm text-muted-foreground">
              Before: {r.anxietyBefore}/10 · After: {r.anxietyAfter}/10
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
