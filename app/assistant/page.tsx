import { AssistantPanel } from "@/components/AssistantPanel";

export default function AssistantPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-stone-900">Assistant</h1>
      <p className="max-w-3xl text-stone-700">
        Questions are answered from the document you loaded. If the text does not
        contain an answer, LegalLens will say so.
      </p>
      <AssistantPanel />
    </div>
  );
}
