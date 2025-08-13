import { cn } from "@/utils/cn"
import { isDev, isStaging } from "@/utils/helpers"

export function DevBanner() {
  const envText = isDev() ? "local" : isStaging() ? "staging" : null
  return (
    <div
      className={cn(
        "text-background italic bg-foreground p-0.5 overflow-hidden",
        envText ? "block" : "hidden"
      )}
    >
      <div className="animate-pulse inline-block text-sm">
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className="mr-14">
            {envText}
          </span>
        ))}
      </div>
    </div>
  )
}
