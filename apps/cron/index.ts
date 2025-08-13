import { heartbeat } from "./src/heartbeat"

heartbeat()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
