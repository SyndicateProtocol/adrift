import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

import { DevBanner } from "@/components/DevBanner"
import Providers from "@/components/providers/Providers"
import { cn } from "@/utils/cn"

const frameEmbed = {
  version: "next",
  imageUrl: "https://adrift.syndicate.io/fc/embed.png",
  button: {
    title: "Open Adrift",
    action: {
      type: "launch_frame",
      name: "Adrift",
      splashImageUrl: "https://adrift.syndicate.io/fc/splash.png",
      splashBackgroundColor: "#E1E3D5"
    }
  }
}

export const metadata: Metadata = {
  title: "Adrift",
  description:
    "Your goal is simple, stay afloat longer than anyone else. Built by Syndicate",
  other: { "fc:miniapp": JSON.stringify(frameEmbed) }
}

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          jetBrainsMono.variable,
          "antialiased bg-background text-foreground font-mono"
        )}
      >
        <DevBanner />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
