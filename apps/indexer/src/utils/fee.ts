export function calculateTotalFee(event: any): bigint {
  const baseFeePerGas = event.block.baseFeePerGas
  const priorityFeePerGas = event.transaction.maxPriorityFeePerGas
  
  if (!baseFeePerGas) {
    return 0n
  }

  const effectiveGasPrice =
    event.transactionReceipt.effectiveGasPrice ||
    baseFeePerGas + (priorityFeePerGas ?? 0n)

  const gasUsed = event.transactionReceipt.gasUsed
  return gasUsed * effectiveGasPrice
}