import { z } from "zod"

const schema = z.object({
  BASE_URL: z.string()
})

const env = schema.parse(process.env)

export async function heartbeat() {
  console.log("Calling heartbeat...")
  const response = await fetch(`${env.BASE_URL}/heartbeat`)
  if (!response.ok) {
    throw new Error(`Failed to call heartbeat: ${response.statusText}`)
  }
  const data = await response.json()
  console.log("Heartbeat response:", data)
}
