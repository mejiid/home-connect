"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/client";

export type AgentInfo = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

const SIGNUP_NOTICE =
  "You must first sign up or sign in to see the agent details.";

export default function ContactAgent({ agent }: { agent: AgentInfo | null }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [showDetails, setShowDetails] = useState(false);

  const agentName = useMemo(() => agent?.name?.trim() || "Agent", [agent?.name]);

  if (!agent) {
    return null;
  }

  const handleClick = () => {
    if (!session?.user) {
      router.push(`/signup?notice=${encodeURIComponent(SIGNUP_NOTICE)}`);
      return;
    }

    setShowDetails(true);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleClick}
        className="w-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-lg py-6"
      >
        Contact Agent
      </Button>

      {showDetails && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          <div className="font-semibold text-zinc-900">{agentName}</div>
          {agent.email && <div className="mt-1">Email: {agent.email}</div>}
          <div className="mt-1">Phone: {agent.phone ? agent.phone : "Not available"}</div>
        </div>
      )}
    </div>
  );
}
