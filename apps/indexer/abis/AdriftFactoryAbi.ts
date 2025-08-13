export const AdriftFactoryAbi = [
  {
    type: "function",
    name: "create",
    inputs: [
      {
        name: "gameAdmin",
        type: "address",
        internalType: "address"
      },
      {
        name: "checkInOutcomes",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract Adrift"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createForever",
    inputs: [
      {
        name: "gameAdmin",
        type: "address",
        internalType: "address"
      },
      {
        name: "checkInOutcomes",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract AdriftForever"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "AdriftCreated",
    inputs: [
      {
        name: "gameAddress",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "checkInOutcomes",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "gameAdmin",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  }
] as const
