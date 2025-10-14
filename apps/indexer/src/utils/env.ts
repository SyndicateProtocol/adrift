import { getAddress, isHex } from "viem"
import { z } from "zod"

const ethAddress = z.string().transform((val, ctx) => {
  try {
    return getAddress(val)
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must be a valid Ethereum address"
    })
    return z.NEVER
  }
})

const hexString = z.string().transform((val, ctx) => {
  if (!isHex(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must be a valid hex string starting with 0x"
    })
    return z.NEVER
  }
  return val
})

export const envSchema = z.object({
  RANDOM_CONTRACT_ADDRESS: ethAddress.describe(
    "The address of the random contract"
  ),
  BUNDLER_ADDRESS: ethAddress.describe("The address of the bundler contract"),
  FACTORY_ADDRESS: ethAddress.describe("The address of the factory contract"),
  START_BLOCK: z
    .string()
    .transform((val) => Number.parseInt(val))
    .describe("The start block of the factory contract"),
  ACTIVE_GAME_ADDRESS: ethAddress.describe(
    "The address of the active game contract"
  ),
  SYNDICATE_TC_PROJECT_ID: z
    .string()
    .describe("The project ID of the Syndicate TC project"),
  SYNDICATE_TC_API_KEY: z
    .string()
    .describe("The API key of the Syndicate TC project"),
  APP_ENV: z
    .enum(["staging", "production", "local"])
    .default("local")
    .describe("The environment of the app"),
  PARA_API_KEY: z.string().describe("The API key of the Para project"),
  LIT_PRIVATE_KEY: z.string().describe("The private key of the Lit account"),
  LIT_PKP_PUBLIC_KEY: z
    .string()
    .describe("The public key of the Lit PKP account"),
  RISA_RPC_URL: z.string().describe("The RPC URL of the Risa testnet"),
  PACIFICA_RPC_URL: z.string().describe("The RPC URL of the Pacifica testnet")
})

export const env = envSchema.parse(process.env)
