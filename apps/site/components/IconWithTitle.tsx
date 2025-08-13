export function IconWithTitle({
  icon,
  title
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
}) {
  const Icon = icon
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {<Icon className="max-w-28 mb-4 mx-auto" />}
      <p className="text-base font-bold mb-2">{title}</p>
    </div>
  )
}
