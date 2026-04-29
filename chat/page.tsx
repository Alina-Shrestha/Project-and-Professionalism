"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
/* Creates a router object to navigate between pages */
export default function ChatPage() {
  const router = useRouter();


/*When the page loads, it immediately redirects the user to /therapy/new*/
  useEffect(() => {
    router.replace("/therapy/new");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Opening your therapy chat...
    </div>
  );
}
