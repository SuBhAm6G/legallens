import { CompareView } from "@/components/CompareView";

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-stone-900">Compare</h1>
      <p className="max-w-3xl text-stone-700">
        Text differences are calculated in application code. The model only explains
        the practical meaning of added, removed, or changed passages.
      </p>
      <CompareView />
    </div>
  );
}
