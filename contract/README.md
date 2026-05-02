# ProofPass Smart Contract

Smart contracts for the ProofPass NFT-based event ticketing platform.

## Setup

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Deploy

### Ganache (Local)
```bash
npm run deploy:ganache
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

## Test

```bash
npm run test
```

## Contract

- **TicketNFT.sol**: ERC721 contract for non-transferable event tickets

## Features

- Non-transferable NFT tickets
- Ticket identity binding (Aadhar ID)
- Picture hash storage for identity verification
- Restricted transfers (only to designated address)
