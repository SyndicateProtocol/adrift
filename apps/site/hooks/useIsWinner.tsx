import { useMe } from "./useMe"

export function useIsWinner() {
  const me = useMe()

  return me?.address && me.isWinner
}
