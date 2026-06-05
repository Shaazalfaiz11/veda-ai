import dns from "node:dns"
import mongoose from "mongoose"

/** SRV lookup for mongodb+srv often fails on Windows with querySrv ECONNREFUSED; public resolvers fix it. */
function configureDnsForMongoSrv() {
  const url = process.env.MONGO_URL ?? ""
  if (!url.startsWith("mongodb+srv:")) return

  const custom = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (custom?.length) {
    dns.setServers(custom)
    return
  }

  const optOut = process.env.MONGO_USE_PUBLIC_DNS === "0"
  const usePublic =
    process.env.MONGO_USE_PUBLIC_DNS === "1" ||
    (process.platform === "win32" && !optOut)

  if (usePublic) {
    dns.setServers(["8.8.8.8", "1.1.1.1"])
  }
}

export const connectDb = async () => {
  try {
    configureDnsForMongoSrv()
    await mongoose.connect(process.env.MONGO_URL as string)
    console.log("✅ MongoDB Connected")
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}