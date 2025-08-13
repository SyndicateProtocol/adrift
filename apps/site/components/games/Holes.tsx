import { useState } from "react"

export function Holes({
  onSuccess,
  isWithinGracePeriod
}: {
  onSuccess: () => Promise<void>
  isWithinGracePeriod: boolean
}) {
  const [clickedHoles, setClickedHoles] = useState(0)
  const [isMending, setIsMending] = useState(false)

  const handleHoleClick = async (index: number) => {
    const newClickedHoles = clickedHoles ^ (1 << index)
    setClickedHoles(newClickedHoles)
    if (newClickedHoles === (1 << count) - 1) {
      setIsMending(true)
      await onSuccess()
      setIsMending(false)
    }
  }

  const isHoleClicked = (index: number) => (clickedHoles & (1 << index)) !== 0
  const count = 10

  // Count the number of set bits (clicked holes)
  const countSetBits = (num: number): number => {
    let count = 0
    let temp = num
    while (temp > 0) {
      count += temp & 1
      temp >>= 1
    }
    return count
  }

  const clickedCount = countSetBits(clickedHoles)
  const remainingPatches = count - clickedCount

  return (
    <>
      {isMending ? (
        <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
          <p className="text-sm">Mending Hull...</p>
        </div>
      ) : (
        <>
          <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
            <p className="text-sm">
              Mend the patches by clicking on all the holes
            </p>
          </div>
          <div className="flex flex-col justify-center items-center p-5 gap-5 flex-1 self-stretch">
            <div className="grid grid-cols-5 grid-rows-2 gap-4 w-[90%] h-full place-items-center">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => handleHoleClick(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleHoleClick(i)
                    }
                  }}
                  className={`w-12 h-12 rounded-full border-2 border-foreground cursor-pointer transition-colors ${
                    isHoleClicked(i) ? "bg-foreground" : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center flex flex-col items-center justify-center p-4 flex-1">
            <p className="text-xs italic">Repair {remainingPatches} patches</p>
          </div>
        </>
      )}
    </>
  )
}
