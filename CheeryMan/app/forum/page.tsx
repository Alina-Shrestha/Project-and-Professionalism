"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Post {
  _id: string;
  alias: string;
  topic: string;
  content: string;
  createdAt: string;
}

export default function ForumPage() {
  const [alias, setAlias] = useState("Anonymous");
  const [topic, setTopic] = useState("general");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/forum", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPosts(Array.isArray(data?.data) ? data.data : []);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const submit = async () => {
    if (!content.trim()) return;
    const token = localStorage.getItem("token");
    await fetch("/api/forum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ alias, topic, content }),
    });
    setContent("");
    loadPosts();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <h1 className="text-3xl font-bold">Community Forum</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Display name" />
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts" rows={4} />
        <Button onClick={submit}>Post</Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post._id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{post.alias}</p>
              <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Topic: {post.topic}</p>
            <p className="mt-2">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
