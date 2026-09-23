"use client";

import type { ChangeEvent } from "react";
import { USER_GOALS, USER_ROLES } from "@/lib/constants";
import { useSession } from "@/components/SessionProvider";

const ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
  employee: "Employee",
  tenant: "Tenant",
  customer: "Customer",
  freelancer: "Freelancer",
  small_business_owner: "Small-business owner",
  other: "Other",
};

const GOAL_LABELS: Record<(typeof USER_GOALS)[number], string> = {
  understand_before_signing: "Understand before signing",
  compare_versions: "Compare versions",
  prepare_for_lawyer: "Prepare for a legal professional",
  ask_questions: "Ask questions about this document",
};

export function ContextForm() {
  const { context, setContext } = useSession();

  function onRole(event: ChangeEvent<HTMLSelectElement>) {
    setContext({
      ...context,
      role: event.target.value as (typeof USER_ROLES)[number],
    });
  }

  function onGoal(event: ChangeEvent<HTMLSelectElement>) {
    setContext({
      ...context,
      goal: event.target.value as (typeof USER_GOALS)[number],
    });
  }

  return (
    <form className="grid gap-3 rounded-lg border border-stone-300 bg-white p-4 sm:grid-cols-2">
      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-stone-800">
          Your role
        </label>
        <select
          id="role"
          className="w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-sm"
          value={context.role}
          onChange={onRole}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="goal" className="mb-1 block text-sm font-medium text-stone-800">
          Your goal
        </label>
        <select
          id="goal"
          className="w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-sm"
          value={context.goal}
          onChange={onGoal}
        >
          {USER_GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {GOAL_LABELS[goal]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="jurisdiction" className="mb-1 block text-sm font-medium text-stone-800">
          Jurisdiction (optional)
        </label>
        <input
          id="jurisdiction"
          className="w-full rounded-md border border-stone-400 px-3 py-2 text-sm"
          value={context.jurisdiction ?? ""}
          onChange={(event) =>
            setContext({
              ...context,
              jurisdiction: event.target.value.trim() ? event.target.value.trim() : null,
            })
          }
        />
      </div>
      <div>
        <label htmlFor="urgency" className="mb-1 block text-sm font-medium text-stone-800">
          Deadline or urgency (optional)
        </label>
        <input
          id="urgency"
          className="w-full rounded-md border border-stone-400 px-3 py-2 text-sm"
          value={context.urgency ?? ""}
          onChange={(event) =>
            setContext({
              ...context,
              urgency: event.target.value.trim() ? event.target.value.trim() : null,
            })
          }
        />
      </div>
    </form>
  );
}
