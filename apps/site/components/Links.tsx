import Link from "next/link"

import { Page } from "./sprites/Page"

interface LinksProps {
  isAboutPage?: boolean
}

export function Links(props: LinksProps) {
  const { isAboutPage } = props
  return (
    <div className="border border-foreground rounded-md">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-b-foreground justify-between">
        <div className="flex items-center gap-2">
          <Page className="w-4" />
          <h2 className="font-bold text-sm">Links</h2>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-3 py-2 text-sm">
        {!isAboutPage && (
          <Link href="/about" className="underline">
            About
          </Link>
        )}
        <a
          href="https://pacifica.explorer.testnet.syndicate.io/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Block explorer
        </a>
        <a
          href="https://farcaster.xyz/~/channel/adrift"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Farcaster channel
        </a>
        <a
          href="https://t.me/syndicateiocommunity"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Telegram group
        </a>
      </div>
    </div>
  )
}
