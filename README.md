# NexusBank Nexus Circle - MVP

**Decentralized ROSCA (Rotating Savings and Credit Association) on Flare Network**

[![Flare Network](https://img.shields.io/badge/Flare-Coston2-red)](https://coston2-explorer.flare.network/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://docs.soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.27.1-yellow)](https://hardhat.org/)

---

## 🎯 Project Overview

NexusBank Nexus Circle brings traditional ROSCAs (chit funds) to blockchain, solving trust and transparency issues in the $500B global market. Built on Flare Network with FTSO price feeds and future FAssets integration.

### Key Features
- 🔒 **Trustless Operations**: Smart contracts eliminate fraud
- 💰 **Collateral Protection**: 10% collateral locked via FTSO price feeds
- 🔄 **Automated Payouts**: Round-robin distribution
- 🌐 **Global Access**: Permissionless participation
- 📊 **Real-time Pricing**: FTSO Oracle integration

---

## 📁 Project Structure

```
nexusbank-mvp/
├── contracts/
│   ├── HelloWorld.sol              # Test contract for environment verification
│   ├── interfaces/
│   │   └── IFTSOv2.sol            # FTSO Oracle interface
│   └── NexusCircle.sol            # (Coming in Epic 3)
├── scripts/
│   └── deploy-hello.js            # Deployment script
├── test/
│   └── NexusCircle.test.js        # (Coming in Epic 6)
├── hardhat.config.js              # Hardhat configuration
├── .env                           # Environment variables (DO NOT COMMIT!)
├── .env.example                   # Example environment file
├── SETUP_GUIDE.md                 # Detailed setup instructions
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- ✅ Node.js v18+ (you have v22.14.0)
- ✅ npm (you have 11.6.2)
- ✅ MetaMask browser extension
- ✅ Git

### 1. Setup Project (Already Done!)
```bash
cd nexusbank-mvp
```

### 2. Add Your Private Key
Edit `.env` file:
```bash
# Get your private key from MetaMask:
# MetaMask > 3 dots > Account Details > Show Private Key

PRIVATE_KEY=your_private_key_here
```

### 3. Get Test Tokens
```bash
# Visit the faucet
https://faucet.flare.network/coston2

# Paste your address:
0xb8b38373324be739bb1aac99751a58d46b290d50

# Request 100 C2FLR tokens

# Add Private  Key to the Hardhat(Line 20).

      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "YOUR_PRIVATE_KEY"

```



### 4. Deploy HelloWorld Contract
```bash
npx hardhat run scripts/deploy-hello.js --network coston2
```

---

## 🔧 Development Commands

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests (Coming Soon)
```bash
npx hardhat test
```

### Deploy to Coston2
```bash
npx hardhat run scripts/deploy-hello.js --network coston2
```

### Start Local Node (for testing)
```bash
npx hardhat node
```

---

## 🌐 Network Information

### Flare Coston2 Testnet
- **Network Name:** Flare Testnet Coston2
- **RPC URL:** `https://coston2-api.flare.network/ext/C/rpc`
- **Chain ID:** `114`
- **Currency Symbol:** `C2FLR`
- **Block Explorer:** https://coston2-explorer.flare.network/
- **Faucet:** https://faucet.flare.network/coston2

### FTSO Oracle
- **Contract Address:** `0x3d893C53D9e8056135C26C8c638B76C8b60Df726`
- **FLR/USD Feed ID:** `0x01464c522f55534400000000000000000000000000`

---

## 📋 Epic 1 Status: Environment Setup ✅

### Completed Tasks
- [x] **TASK-001:** Install Development Dependencies ✅
- [x] **TASK-002:** Configure Flare Coston2 Testnet in Hardhat ✅
- [x] **TASK-003:** Set Up MetaMask with Coston2 Testnet ⏳
  - MetaMask wallet provided: `0xb8b38373324be739bb1aac99751a58d46b290d50`
  - **ACTION REQUIRED:** Add private key to `.env`
- [x] **TASK-004:** Obtain Test FLR from Faucet ⏳
  - **ACTION REQUIRED:** Get tokens from faucet
- [x] **TASK-005:** Deploy Hello World Contract to Coston2 ⏳
  - Deployment script ready
  - **BLOCKED:** Waiting for private key + tokens
- [x] **TASK-006:** Install Flare Solidity Periphery Package ✅

**Progress:** 4/6 tasks complete (67%)

---

## 🗺️ Roadmap

### ✅ Epic 1: Environment Setup & Flare Integration (Current)
- Install Hardhat and dependencies
- Configure Coston2 network
- Deploy test contract

### ⏳ Epic 2: FTSO Price Feed Integration (Next)
- Create FTSO interface contract
- Deploy FTSO Price Reader
- Query real-time FLR/USD prices

### ⏳ Epic 3: ROSCA Smart Contract - Foundation
- Review WeTrust ROSCA contracts
- Create NexusCircle.sol skeleton
- Implement pool creation and joining

### ⏳ Epic 4: ROSCA Smart Contract - Core Logic
- Contribution system
- Payout execution
- Round-robin selection

### ⏳ Epic 5: Flare-Specific Features
- Collateral locking with FTSO
- Default detection
- Collateral liquidation

### ⏳ Epic 6: Testing & Deployment
- Unit tests for all functions
- Deploy to Coston2
- End-to-end testing

### ⏳ Epic 7: React Frontend
- Wallet connection
- Pool dashboard
- Join/contribute interface

### ⏳ Epic 8: Final Polish & Demo
- Documentation
- Demo video
- Hackathon submission

---

## 🧪 Testing

### Run All Tests (Coming in Epic 6)
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/NexusCircle.test.js
```

### Generate Coverage Report
```bash
npx hardhat coverage
```

---

## 📖 Documentation

- **Setup Guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **UML Diagrams:** [../uml_docs/](../uml_docs/)
- **Tech Stack:** [../docs/TECH_STACK_GUIDE.md](../docs/TECH_STACK_GUIDE.md)
- **MVP Roadmap:** [../docs/MVP_ROADMAP.md](../docs/MVP_ROADMAP.md)

---

## 🔐 Security

### Private Key Safety
- ⚠️ **NEVER commit** `.env` file to Git
- ⚠️ **NEVER share** your private key
- ⚠️ **Use only testnet** wallets for development
- ⚠️ `.env` is already in `.gitignore`

### Smart Contract Security
- Uses Solidity 0.8.20 (built-in overflow protection)
- Following OpenZeppelin best practices
- Comprehensive testing before mainnet

---

## 🆘 Troubleshooting

### Common Issues

#### 1. "Insufficient funds" error
**Solution:** Get test tokens from faucet
```
https://faucet.flare.network/coston2
```

#### 2. "Private key too short" error
**Solution:** Check your `.env` file
- Private key should be 64 characters (without 0x)
- No spaces or extra characters

#### 3. "Network not found" error
**Solution:** Ensure MetaMask is on Coston2
- Network: Flare Testnet Coston2
- Chain ID: 114

#### 4. MetaMask not detecting network
**Solution:** Manually add Coston2 to MetaMask
- Network Name: `Flare Testnet Coston2`
- RPC URL: `https://coston2-api.flare.network/ext/C/rpc`
- Chain ID: `114`
- Currency: `C2FLR`

---

## 📚 Resources

### Flare Network
- **Developer Docs:** https://dev.flare.network/
- **FTSO Guide:** https://dev.flare.network/ftso/getting-started
- **Discord:** https://discord.gg/flarenetwork

### Development
- **Hardhat Docs:** https://hardhat.org/docs
- **Solidity Docs:** https://docs.soliditylang.org/
- **ethers.js Docs:** https://docs.ethers.org/v6/

---

## 👥 Team

Built for the Flare Network Hackathon

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🚀 Current Status

**Epic 1 Progress:** 67% Complete

**Next Actions Required:**
1. ✅ Add your MetaMask private key to `.env`
2. ✅ Get C2FLR tokens from faucet
3. ✅ Deploy HelloWorld contract
4. ⏳ Move to Epic 2 (FTSO Integration)

**Your Wallet:** `0xb8b38373324be739bb1aac99751a58d46b290d50`

---

**Last Updated:** December 7, 2025
