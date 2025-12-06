# NexusBank MVP - Setup Guide
## Quick Start for Epic 1: Environment Setup & Flare Integration

---

## ✅ Completed Steps

### 1. Node.js Dependencies ✓
- ✅ Node.js v22.14.0 installed
- ✅ npm 11.6.2 installed
- ✅ Hardhat 2.27.1 installed
- ✅ All development dependencies configured

### 2. Project Structure ✓
```
nexusbank-mvp/
├── contracts/
│   ├── HelloWorld.sol           ✅ Created
│   └── interfaces/
│       └── IFTSOv2.sol          ✅ Created
├── scripts/
│   └── deploy-hello.js          ✅ Created
├── test/
├── hardhat.config.js            ✅ Configured for Coston2
├── .env                         ✅ Created (needs private key)
├── .env.example                 ✅ Created
└── .gitignore                   ✅ Created
```

### 3. Flare Coston2 Configuration ✓
- ✅ RPC URL: `https://coston2-api.flare.network/ext/C/rpc`
- ✅ Chain ID: 114
- ✅ Network configured in hardhat.config.js
- ✅ FTSO Oracle address: `0x3d893C53D9e8056135C26C8c638B76C8b60Df726`

### 4. Smart Contracts ✓
- ✅ HelloWorld.sol compiled successfully
- ✅ IFTSOv2 interface created
- ✅ Deployment script ready

---

## 🔧 Required: Add Your Private Key

**Your wallet address:** `0xb8b38373324be739bb1aac99751a58d46b290d50`

### How to Get Your Private Key from MetaMask:

1. **Open MetaMask** extension in your browser
2. Click the **3 dots menu** (⋮) in the top right
3. Select **"Account Details"**
4. Click **"Show Private Key"**
5. Enter your **MetaMask password**
6. **Copy the private key** (64 characters, may start with 0x)

### Add Private Key to .env File:

**Method 1: Edit in VS Code**
```bash
# Open the file
code nexusbank-mvp/.env

# Replace this line:
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# With your actual private key (remove 0x if present):
PRIVATE_KEY=your_64_character_private_key_here
```

**Method 2: Edit with Notepad**
1. Open `nexusbank-mvp/.env` in Notepad
2. Find the line `PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE`
3. Replace with your actual private key
4. Save the file

⚠️ **SECURITY WARNING:**
- **NEVER share your private key** with anyone
- **NEVER commit the .env file** to Git (it's already in .gitignore)
- This key gives **full access** to your wallet funds
- Only use **testnet wallets** for development

---

## 💧 Get Test Tokens from Faucet

You need Coston2 FLR (C2FLR) tokens to deploy contracts and pay for gas fees.

### Step 1: Visit the Faucet
🔗 **Faucet URL:** https://faucet.flare.network/coston2

### Step 2: Request Tokens
1. Paste your address: `0xb8b38373324be739bb1aac99751a58d46b290d50`
2. Complete the CAPTCHA
3. Click "Request C2FLR"
4. Wait 1-2 minutes for transaction to confirm

### Step 3: Verify Balance
Check your MetaMask:
- Should show **100+ C2FLR** balance
- Network should be **"Flare Testnet Coston2"**
- Currency symbol: **C2FLR**

**Need more tokens?**
- Faucet allows requests every 24 hours
- You can use multiple wallet addresses if needed

---

## 🚀 Deploy HelloWorld Contract

Once you have:
1. ✅ Private key added to `.env`
2. ✅ C2FLR tokens in your wallet

### Deploy Command:
```bash
cd nexusbank-mvp
npx hardhat run scripts/deploy-hello.js --network coston2
```

### Expected Output:
```
============================================================
Deploying HelloWorld Contract to Flare Coston2
============================================================

📝 Deployment Information:
   Deployer address: 0xb8b38373324be739bb1aac99751a58d46b290d50
   Account balance: 100.0 C2FLR

🚀 Deploying HelloWorld contract...

✅ HelloWorld deployed successfully!
   Contract address: 0x...
   Transaction hash: 0x...

🧪 Testing contract...
   Message: Hello Flare!
   Owner: 0xb8b38373324be739bb1aac99751a58d46b290d50
   Deployment timestamp: [date/time]

============================================================
🎉 Deployment Complete!
============================================================

📋 Next Steps:
   1. View on Explorer:
      https://coston2-explorer.flare.network/address/0x...

   2. Update your .env file:
      HELLO_WORLD_ADDRESS=0x...
```

---

## 🔍 Verify Deployment on Block Explorer

### Option 1: Automatic Link
After deployment, click the explorer link shown in the output.

### Option 2: Manual Verification
1. Go to: https://coston2-explorer.flare.network/
2. Paste your contract address in the search bar
3. You should see:
   - ✅ Contract deployed
   - ✅ Creator address (your wallet)
   - ✅ Deployment transaction
   - ✅ Contract code (bytecode)

### Read Contract Functions:
1. Click on "**Contract**" tab
2. Click "**Read Contract**"
3. Try calling:
   - `getMessage()` → Should return "Hello Flare!"
   - `owner()` → Should return your address
   - `deploymentTimestamp()` → Unix timestamp

---

## ✅ Epic 1 Completion Checklist

- [x] **TASK-001:** Install Development Dependencies
- [x] **TASK-002:** Configure Flare Coston2 Testnet in Hardhat
- [ ] **TASK-003:** Set Up MetaMask with Coston2 Testnet
  - ✅ MetaMask installed
  - ✅ Wallet address provided: `0xb8b38373324be739bb1aac99751a58d46b290d50`
  - ⏳ **ACTION REQUIRED:** Add Coston2 network to MetaMask
- [ ] **TASK-004:** Obtain Test FLR from Faucet
  - ⏳ **ACTION REQUIRED:** Get tokens from https://faucet.flare.network/coston2
- [ ] **TASK-005:** Deploy Hello World Contract to Coston2
  - ⏳ **BLOCKED:** Waiting for private key and test tokens
- [ ] **TASK-006:** Install Flare Solidity Periphery Package
  - ✅ Created IFTSOv2 interface manually

---

## 🐛 Troubleshooting

### Issue: "Error: insufficient funds"
**Solution:** Get more C2FLR from faucet
```
https://faucet.flare.network/coston2
```

### Issue: "Error: private key too short"
**Solution:** Check your `.env` file:
- Private key should be 64 characters (without 0x) or 66 characters (with 0x)
- No spaces or extra characters
- Use the correct private key from MetaMask

### Issue: "Error: network does not exist"
**Solution:** Make sure you're in the `nexusbank-mvp` directory:
```bash
cd nexusbank-mvp
npx hardhat run scripts/deploy-hello.js --network coston2
```

### Issue: MetaMask shows wrong network
**Solution:** Add Coston2 network to MetaMask:
- Network Name: `Flare Testnet Coston2`
- RPC URL: `https://coston2-api.flare.network/ext/C/rpc`
- Chain ID: `114`
- Currency Symbol: `C2FLR`
- Block Explorer: `https://coston2-explorer.flare.network/`

---

## 📝 Next Steps (Epic 2 & Beyond)

After successfully deploying HelloWorld:

### Epic 2: FTSO Price Feed Integration
- Create FTSOPriceReader contract
- Query FLR/USD price from FTSO Oracle
- Test price feed on Coston2

### Epic 3: ROSCA Smart Contract
- Review WeTrust ROSCA contracts
- Create NexusCircle.sol contract
- Implement pool creation and joining

### Epic 4: Core ROSCA Logic
- Implement contribution function
- Add payout execution
- Member tracking and round management

---

## 📚 Useful Resources

### Flare Network
- **Docs:** https://dev.flare.network/
- **FTSO Guide:** https://dev.flare.network/ftso/getting-started
- **Faucet:** https://faucet.flare.network/coston2
- **Explorer:** https://coston2-explorer.flare.network/

### Hardhat
- **Docs:** https://hardhat.org/docs
- **Tutorial:** https://hardhat.org/tutorial

### Solidity
- **Docs:** https://docs.soliditylang.org/
- **By Example:** https://solidity-by-example.org/

---

## 🆘 Need Help?

**Current Status:**
- ✅ Environment setup: **COMPLETE**
- ✅ Contracts compiled: **COMPLETE**
- ⏳ Deployment ready: **Waiting for you to add private key**

**Next Action Required:**
1. Add your MetaMask private key to `.env` file
2. Get test tokens from faucet
3. Run deployment command

**Your wallet address:** `0xb8b38373324be739bb1aac99751a58d46b290d50`

---

**Last Updated:** December 7, 2025
**Epic 1 Progress:** 4/6 tasks complete (67%)
