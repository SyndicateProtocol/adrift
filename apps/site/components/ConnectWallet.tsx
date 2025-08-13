"use client"

import { useAccount, useClient, useModal, useWallet } from "@getpara/react-sdk"

export function ConnectWallet() {
  const { openModal } = useModal()
  const { embedded } = useAccount()
  const { data: wallet } = useWallet()
  const para = useClient()

  if (embedded?.isConnected && wallet) {
    return (
      <button
        type="button"
        onClick={() => openModal()}
        className="bg-background px-4 py-2 rounded-md block text-foreground border border-foreground cursor-pointer"
      >
        {para?.getDisplayAddress(wallet.id, {
          truncate: true,
          addressType: wallet.type
        })}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openModal()}
      className="bg-foreground px-4 py-2 rounded-md block text-background cursor-pointer"
    >
      Sign In
    </button>
  )
}
