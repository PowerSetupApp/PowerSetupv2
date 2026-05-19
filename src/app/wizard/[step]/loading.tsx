import { LoadingIndicator } from "@/components/ui/loading-indicator";

export default function WizardStepLoading() {
  return (
    <div className="flex min-h-[min(50vh,28rem)] flex-1 items-center justify-center px-4">
      <LoadingIndicator />
    </div>
  );
}
