import "dotenv/config"

import express   from "express"
import http      from "http"
import https     from "https"
import cors      from "cors"

import { connectDb }       from "./config/db"
import { initSocket }      from "./socket"
import assignmentRoutes    from "./routes/assignment.routes"
import bookRoutes          from "./routes/book.routes"
import tutorRoutes         from "./routes/tutor.routes"

const app = express()

// Allow all origins to prevent Vercel blocking issues
app.use(cors({ origin: "*" }))
app.use(express.json())
app.use("/api/assignments", assignmentRoutes)
app.use("/api/books", bookRoutes)
app.use("/api/tutor", tutorRoutes)

app.get("/", (_req, res) => res.send("VedaAI Backend Running 🚀"))

connectDb()

const server = http.createServer(app)
initSocket(server)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  
  // Keep-alive ping to safely prevent the Render free tier from sleeping
  const RENDER_URL = "https://vedaai-backend-n96c.onrender.com/"
  setInterval(() => {
    https.get(RENDER_URL, (res) => {
      console.log(`[Keep-Alive] Ping successful: ${res.statusCode}`)
    }).on('error', (err) => {
      console.error(`[Keep-Alive] Ping failed:`, err.message)
    })
  }, 14 * 60 * 1000) // Ping every 14 minutes
})