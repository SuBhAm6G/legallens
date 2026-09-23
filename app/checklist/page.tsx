import { ChecklistPanel } from "@/components/ChecklistPanel";

export default function ChecklistPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-stone-900">Checklist</h1>
      <p className="max-w-3xl text-stone-700">
        Use this pack to prepare a conversation with a legal professional. It is
        not a substitute for advice.
      </p>
      <ChecklistPanel />
    </div>
  );
}
