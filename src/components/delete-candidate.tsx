"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icons";

export function DeleteCandidate({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div className="flex items-center gap-2 text-[12px] text-muted">
      Deletes resume text, evidence and derived results.
      <button
        className="btn-danger"
        onClick={async () => {
          await fetch(`/api/candidates/${id}`, { method: "DELETE" });
          router.push("/candidates");
          router.refresh();
        }}
      >
        Delete permanently
      </button>
      <button className="btn-ghost" onClick={() => setConfirm(false)}>
        Cancel
      </button>
    </div>
  ) : (
    <button className="btn-danger" onClick={() => setConfirm(true)}>
      <Icon name="trash" className="size-3.5" /> Delete
    </button>
  );
}
