import { cn } from "@/utils/cn"

export function ClickGame({
  isWithinGracePeriod,
  onSuccess
}: { isWithinGracePeriod: boolean; onSuccess: () => void }) {
  return (
    <div className="flex gap-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full border border-foreground cursor-pointer",
          {
            "border-red-400 hover:bg-red-500": !isWithinGracePeriod,
            "border-foreground hover:bg-foreground": isWithinGracePeriod
          }
        )}
        onClick={onSuccess}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSuccess()
          }
        }}
      />
    </div>
  )
}
