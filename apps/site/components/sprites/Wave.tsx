import type { SVGProps } from "react"

export default function Wave(props: SVGProps<SVGSVGElement>) {
  const { className, style } = props
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 851 300"
      className={className}
      style={style}
    >
      <path
        fill="#000"
        d="M800.5 0h50v50h-50zM750.5 50h50v50h-50zM700.5 100h50v50h-50zM650.5 100h50v50h-50zM600.5 100h50v50h-50zM550.5 50h50v50h-50zM300.5 50h50v50h-50zM500.5 50h50v50h-50zM250.5 50h50v50h-50zM.5 0h50v50H.5zM50.5 50h50v50h-50zM450.5 100h50v50h-50zM200.5 100h50v50h-50zM400.5 100h50v50h-50zM150.5 100h50v50h-50zM350.5 100h50v50h-50zM100.5 100h50v50h-50zM800.5 150h50v50h-50zM750.5 200h50v50h-50zM700.5 250h50v50h-50zM650.5 250h50v50h-50zM600.5 250h50v50h-50zM550.5 200h50v50h-50zM300.5 200h50v50h-50zM500.5 200h50v50h-50zM250.5 200h50v50h-50zM.5 150h50v50H.5zM50.5 200h50v50h-50zM450.5 250h50v50h-50zM200.5 250h50v50h-50zM400.5 250h50v50h-50zM150.5 250h50v50h-50zM350.5 250h50v50h-50zM100.5 250h50v50h-50z"
      />
    </svg>
  )
}
