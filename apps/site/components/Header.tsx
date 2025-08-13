import Link from "next/link"

import { ConnectWallet } from "./ConnectWallet"
import { Logo } from "./sprites/Logo"

export function Header() {
  return (
    <header className="flex justify-between items-center mb-6 gap-4">
      <Link href="/" className="max-w-40">
        <Logo className="w-full text-foreground" />
      </Link>

      <ConnectWallet />
    </header>
  )
}
