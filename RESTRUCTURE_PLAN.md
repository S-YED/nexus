# NexusBank MVP - Project Restructuring Plan

## Current Issues

### 1. Nested Frontend Structure
- **Problem**: `frontend/frontend/` creates confusion
- **Impact**: Unclear paths, complicated CD/CI
- **Solution**: Flatten to `frontend/`

### 2. Duplicate Backend Code
- **Problem**: Smart contracts in root AND `frontend/backend/`
- **Impact**: Sync issues, duplicate dependencies
- **Solution**: Keep only root-level contracts

### 3. Documentation Chaos
- **Problem**: 13 markdown files scattered across project
- **Impact**: Duplicate info, hard to maintain
- **Solution**: Consolidate into `docs/` folder

### 4. Root-Level Clutter
- **Problem**: Utility scripts in root directory
- **Impact**: Messy root, hard to navigate
- **Solution**: Move to `scripts/` folder

---

## Target Structure

```
nexusbank-mvp/
├── contracts/                      # Solidity smart contracts
│   ├── NexusCircle.sol
│   ├── FTSOPriceReader.sol
│   ├── HelloWorld.sol
│   └── interfaces/
│       ├── IFlareContractRegistry.sol
│       └── IFTSOv2.sol
│
├── scripts/                        # Deployment & utility scripts
│   ├── deployment/
│   │   ├── deploy-nexus-circle.js
│   │   ├── deploy-ftso-reader.js
│   │   └── deploy-hello.js
│   ├── testing/
│   │   ├── test-nexus-circle.js
│   │   ├── test-ftso-reader.js
│   │   └── demo-nexus-circle-epic4.js
│   └── utils/
│       ├── get-pool-id.js
│       └── test-deployed-contract.js
│
├── test/                           # Smart contract tests
│   └── NexusCircle.test.js
│
├── frontend/                       # React application (NO NESTING!)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # ShadCN components
│   │   │   ├── PoolCard.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── BrowsePools.tsx
│   │   │   ├── CreatePool.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── usePools.ts
│   │   │   ├── useWallet.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── blockchainService.ts
│   │   ├── contracts/
│   │   │   └── NexusCircleABI.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── dist/                       # Build output (gitignored)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── postcss.config.js
│   ├── components.json
│   └── package.json
│
├── docs/                           # All documentation
│   ├── README.md                   # Main project README
│   ├── QUICK_START.md              # Getting started guide
│   ├── ARCHITECTURE.md             # Technical architecture
│   ├── BLOCKCHAIN_INTEGRATION.md   # Blockchain details
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── TROUBLESHOOTING.md          # Common issues & solutions
│   └── API.md                      # Contract API documentation
│
├── deployments/                    # Deployment artifacts
│   ├── nexus-circle-epic4-coston2.json
│   └── nexus-circle-final-coston2.json
│
├── artifacts/                      # Hardhat build outputs (gitignored)
├── cache/                          # Hardhat cache (gitignored)
│
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── hardhat.config.js               # Hardhat configuration
├── package.json                    # Backend dependencies
├── package-lock.json               # Lock file
└── README.md                       # Root README (links to docs/)
```

---

## Migration Steps

### Phase 1: Backup & Preparation ✅
1. Commit current state to git
2. Create backup branch: `git checkout -b backup/before-restructure`
3. Create feature branch: `git checkout -b refactor/project-structure`

### Phase 2: Fix Frontend Nesting 🔧
1. Move `frontend/frontend/*` → `frontend-temp/`
2. Delete `frontend/` directory
3. Rename `frontend-temp/` → `frontend/`
4. Update all import paths if needed

### Phase 3: Remove Duplicate Backend 🗑️
1. Verify root contracts are the latest version
2. Delete entire `frontend/backend/` directory
3. Update frontend to use root-level artifacts

### Phase 4: Organize Scripts 📁
1. Create `scripts/deployment/`, `scripts/testing/`, `scripts/utils/`
2. Move deployment scripts to `scripts/deployment/`
3. Move test scripts to `scripts/testing/`
4. Move utility scripts from root to `scripts/utils/`

### Phase 5: Consolidate Documentation 📚
1. Create `docs/` directory
2. Merge duplicate docs:
   - TROUBLESHOOTING.md + TROUBLESHOOTING_GUIDE.md → docs/TROUBLESHOOTING.md
   - QUICK_START.md + QUICK_START_BLOCKCHAIN.md → docs/QUICK_START.md
3. Move all other .md files to `docs/`
4. Keep only README.md in root (with links to docs/)

### Phase 6: Clean Configuration Files 🔧
1. Remove `frontend/package-lock.json` (keep pnpm-lock.yaml OR package-lock.json, not both)
2. Update frontend package.json name: `"vite_react_shadcn_ts"` → `"nexusbank-frontend"`
3. Create single `.env.example` in root
4. Consolidate `.gitignore` files

### Phase 7: Update Import Paths 🔗
1. Search for imports referencing old paths
2. Update any hardcoded paths in configs
3. Update deployment scripts paths

### Phase 8: Update Documentation 📝
1. Update root README.md with new structure
2. Update all docs with correct file paths
3. Create PROJECT_STRUCTURE.md for reference

### Phase 9: Testing & Verification ✅
1. Run `npm install` in root (Hardhat)
2. Run `npm install` in frontend/ (React)
3. Test contract compilation: `npx hardhat compile`
4. Test frontend build: `cd frontend && npm run build`
5. Verify all import paths work
6. Run contract tests: `npx hardhat test`

### Phase 10: Cleanup & Commit 🎉
1. Remove unused files
2. Commit changes: `git add -A && git commit -m "refactor: restructure project to follow best practices"`
3. Test everything one more time
4. Merge to main branch

---

## Files to Delete

### Duplicates
- [ ] `frontend/backend/` (entire directory)
- [ ] `frontend/frontend/TROUBLESHOOTING_GUIDE.md` (merge into TROUBLESHOOTING.md)
- [ ] Multiple duplicate README files

### Temporary/Generated
- [ ] `frontend/frontend/test-contract.html` (manual test file)
- [ ] `frontend/frontend/src/services/testDirect.ts` (if not needed)

### Root Clutter
- [ ] `get-pool-id.js` (move to scripts/utils/)
- [ ] `test-deployed-contract.js` (move to scripts/utils/)
- [ ] `deployment-nexus-circle.json` (move to deployments/)

---

## Expected Benefits

### Developer Experience
- ✅ Clear, flat structure
- ✅ Easy to navigate
- ✅ Standard conventions
- ✅ Better IDE support

### Maintenance
- ✅ Single source of truth for contracts
- ✅ Organized documentation
- ✅ No duplicate code
- ✅ Easier onboarding

### CI/CD
- ✅ Clear build paths
- ✅ Predictable structure
- ✅ Standard deployment scripts
- ✅ Better automation

### Collaboration
- ✅ Standard project layout
- ✅ Clear responsibilities (frontend/contracts)
- ✅ Consolidated docs
- ✅ Professional appearance

---

## Risk Mitigation

### Before Starting
1. ✅ Commit all current work
2. ✅ Create backup branch
3. ✅ Document current import paths
4. ✅ List all scripts that reference paths

### During Migration
1. Work on feature branch
2. Test incrementally after each phase
3. Keep backup accessible
4. Document any issues encountered

### Rollback Plan
If issues occur:
```bash
git checkout main
git branch -D refactor/project-structure
git checkout backup/before-restructure
```

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|---------------|
| 1. Backup & Preparation | 5 minutes |
| 2. Fix Frontend Nesting | 15 minutes |
| 3. Remove Duplicate Backend | 10 minutes |
| 4. Organize Scripts | 10 minutes |
| 5. Consolidate Documentation | 20 minutes |
| 6. Clean Configuration | 15 minutes |
| 7. Update Import Paths | 20 minutes |
| 8. Update Documentation | 15 minutes |
| 9. Testing & Verification | 30 minutes |
| 10. Cleanup & Commit | 10 minutes |
| **Total** | **~2.5 hours** |

---

## Next Steps

**Ready to proceed?** I can execute this restructuring automatically, or we can do it step-by-step so you understand each change.

**Options:**
1. **Automated**: I'll execute all phases with your approval
2. **Step-by-step**: We'll do each phase together, reviewing changes
3. **Partial**: Pick specific phases to fix first

**Recommendation**: Step-by-step approach for critical restructuring like this.
