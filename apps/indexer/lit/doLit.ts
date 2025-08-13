import { getLitBundlerTransaction } from "./lit"

const bundlerTransaction = await getLitBundlerTransaction()
console.log("bundlerTransaction", bundlerTransaction)
process.exit(0)
