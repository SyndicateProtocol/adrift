import { SyndicateClient } from "@syndicateio/syndicate-node"
import { env } from "./env"

export const syndicate = new SyndicateClient({
  token: env.SYNDICATE_TC_API_KEY
})
