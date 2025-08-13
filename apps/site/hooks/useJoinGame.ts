import { API_URL } from "@/utils/constants"
import { useMutation } from "@tanstack/react-query"

export function useJoinGame() {
  return useMutation({
    mutationFn: async ({
      playerAddress
    }: {
      playerAddress: string
    }) => {
      const response = await fetch(`${API_URL}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerAddress: playerAddress
        })
      })
      return response.json()
    }
  })
}
