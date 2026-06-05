import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/Sidebar"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "VedaAI - by Shaaz Alfaiz",
  description: "Create AI-powered assignments and question papers",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body suppressHydrationWarning className="bg-[#CECECE] md:bg-[#EEEEEE] font-['Plus_Jakarta_Sans']" style={{ background: 'linear-gradient(180deg, #EEEEEE 0%, #DADADA 100%)' }}>
        <Sidebar />
        <main className="md:ml-[350px] ml-0 min-h-screen pt-20 md:pt-6 pb-24 md:pb-6 md:pr-6">
          {children}
        </main>
      </body>
    </html>
  )
}