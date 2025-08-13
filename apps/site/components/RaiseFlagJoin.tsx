import { useWallet } from "@getpara/react-sdk"
import { motion } from "motion/react"
import { useState } from "react"

import { useJoinGameWithPolling } from "@/hooks/useJoinGameWithPolling"
import { cn } from "@/utils/cn"
import { Flag } from "./sprites/Flag"

// 224 height of mast - 37 height of flagpole = 187px
const FLAGPOLE_TOP = 224 - 37

export function RaiseFlagJoin() {
  const [isRaisingFlag, setIsRaisingFlag] = useState(false)
  const { joinGameWithPolling, isPolling } = useJoinGameWithPolling({
    onError: (error) => {
      console.error("Failed to join game or player did not appear:", error)
    }
  })
  const { data: wallet } = useWallet()

  const handleJoinGame = async () => {
    if (!wallet?.address || isPolling) return

    try {
      await joinGameWithPolling()
    } catch (error) {
      console.error("Error joining game:", error)
    }
  }

  return (
    <div className="flex flex-col text-center py-4 px-2 grow">
      <p className="mb-2">
        {isPolling ? "Boarding ship..." : "Raise your flag to board your ship."}
      </p>

      <div className="grow flex items-center justify-center">
        <motion.div className="h-56 relative mb-4">
          <motion.div
            className={cn(
              "absolute bottom-0 left-1/2 -translate-x-[48px] z-10",
              !isRaisingFlag && "cursor-pointer"
            )}
            style={{ pointerEvents: isPolling ? "none" : "auto" }}
            onTapStart={() => setIsRaisingFlag(true)}
            animate={{
              bottom: isRaisingFlag ? FLAGPOLE_TOP : 0
            }}
            initial={false}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
            onAnimationComplete={() => handleJoinGame()}
          >
            <Flag className="w-12" />
          </motion.div>
          <motion.div
            className="w-3 h-full bg-foreground absolute bottom-0 left-1/2 -translate-x-1/2 z-0"
            onTapStart={() => setIsRaisingFlag(true)}
          />
        </motion.div>
      </div>

      {!isPolling && <p>Click the colored flag to raise it to the top.</p>}
    </div>
  )
}
