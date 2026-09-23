import { ContextForm } from "@/components/ContextForm";
import { DocumentBriefPanel } from "@/components/DocumentBriefPanel";
import { FileUpload } from "@/components/FileUpload";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-stone-900">Documents</h1>
      <p className="max-w-3xl text-stone-700">
        LegalLens turns an agreement into a Document Brief: what it is, who is named,
        what looks important, and what you may want to ask a legal professional.
      </p>
      <ContextForm />
      <FileUpload />
      <DocumentBriefPanel />
    </div>
  );
}
