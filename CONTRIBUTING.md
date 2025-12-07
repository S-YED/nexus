# Contributing to NexusBank MVP

Thank you for your interest in contributing to NexusBank! This document provides guidelines and instructions for contributing to the project.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Project Structure](#project-structure)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and constructive
- Welcome newcomers and help them get started
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling or insulting comments
- Publishing others' private information
- Unprofessional conduct

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js v18+ installed
- Git installed and configured
- MetaMask browser extension
- Basic understanding of:
  - Solidity and smart contracts
  - React and TypeScript
  - Git workflow

### Initial Setup

```bash
# 1. Fork the repository
# Click "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/nexusbank-mvp.git
cd nexusbank-mvp

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/nexusbank-mvp.git

# 4. Install dependencies
npm install
cd frontend && npm install && cd ..

# 5. Set up environment
cp .env.example .env
# Edit .env with your testnet private key

# 6. Get test tokens
# Visit: https://faucet.flare.network/coston2

# 7. Verify setup
npx hardhat compile
cd frontend && npm run build && cd ..
```

---

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `chore/description` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Test smart contracts
npx hardhat test

# Test frontend
cd frontend
npm run lint
npm run build
cd ..

# Manual testing
cd frontend && npm run dev
# Test in browser at http://localhost:5173
```

### 4. Commit Your Changes

Follow our [commit guidelines](#commit-guidelines):

```bash
git add .
git commit -m "feat: add pool search functionality"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📝 Coding Standards

### Solidity (Smart Contracts)

#### Style Guide

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Brief contract description
/// @author Your Name
/// @notice Explain what the contract does
contract ExampleContract {
    // State variables
    uint256 public constant MAX_MEMBERS = 6;
    mapping(uint256 => Pool) private pools;

    // Events
    event PoolCreated(uint256 indexed poolId, address indexed creator);

    // Structs
    struct Pool {
        uint256 contributionAmount;
        uint256 maxMembers;
        bool isActive;
    }

    // Modifiers
    modifier onlyActive(uint256 poolId) {
        require(pools[poolId].isActive, "Pool not active");
        _;
    }

    // Functions: external > public > internal > private
    function createPool(uint256 amount) external payable {
        // Implementation
    }

    function _internalHelper() internal pure returns (uint256) {
        // Implementation
    }
}
```

#### Best Practices

- Use descriptive variable names
- Add NatSpec comments for all public functions
- Check for overflows (use Solidity 0.8+)
- Validate all inputs
- Emit events for state changes
- Use custom errors instead of require strings (gas savings)
- Follow CEI pattern (Checks-Effects-Interactions)

#### Security Checklist

- [ ] No reentrancy vulnerabilities
- [ ] Access control properly implemented
- [ ] Integer overflow/underflow handled
- [ ] Input validation for all functions
- [ ] No unhandled external calls
- [ ] Events emitted for important actions

### TypeScript/React (Frontend)

#### Style Guide

```typescript
// Use functional components with hooks
import { useState, useEffect } from 'react';

interface PoolCardProps {
  poolId: number;
  contributionAmount: string;
  onJoin: (poolId: number) => Promise<void>;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  poolId,
  contributionAmount,
  onJoin,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      await onJoin(poolId);
    } catch (error) {
      console.error('Failed to join pool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pool-card">
      <h3>Pool #{poolId}</h3>
      <p>{contributionAmount} C2FLR</p>
      <button onClick={handleJoin} disabled={isLoading}>
        {isLoading ? 'Joining...' : 'Join Pool'}
      </button>
    </div>
  );
};
```

#### Best Practices

- Use TypeScript for type safety
- Functional components with hooks
- Descriptive component and variable names
- Extract reusable logic into custom hooks
- Handle loading and error states
- Use async/await for promises
- Avoid inline styles (use Tailwind classes)
- Keep components under 200 lines

#### File Organization

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # ShadCN components
│   └── PoolCard.tsx
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── services/        # Business logic & API
├── types/           # TypeScript types
└── utils/           # Helper functions
```

### General Principles

1. **DRY (Don't Repeat Yourself)**: Extract common code
2. **KISS (Keep It Simple)**: Simplest solution that works
3. **YAGNI (You Aren't Gonna Need It)**: Don't over-engineer
4. **Single Responsibility**: One function = one purpose
5. **Self-Documenting Code**: Clear names > comments

---

## 🧪 Testing Guidelines

### Smart Contract Tests

```javascript
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('NexusCircle', function () {
  let nexusCircle;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const NexusCircle = await ethers.getContractFactory('NexusCircle');
    nexusCircle = await NexusCircle.deploy();
  });

  describe('Pool Creation', function () {
    it('should create pool with correct parameters', async function () {
      const contributionAmount = ethers.parseEther('100');
      const collateral = contributionAmount / 10n;

      await expect(
        nexusCircle.connect(user1).createPool(contributionAmount, {
          value: collateral,
        })
      )
        .to.emit(nexusCircle, 'PoolCreated')
        .withArgs(0, user1.address, contributionAmount, 6);
    });

    it('should revert if insufficient collateral', async function () {
      const contributionAmount = ethers.parseEther('100');

      await expect(
        nexusCircle.connect(user1).createPool(contributionAmount, {
          value: 0,
        })
      ).to.be.revertedWith('Insufficient collateral');
    });
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 100% coverage
- **Test Types**:
  - Unit tests for individual functions
  - Integration tests for workflows
  - Edge cases and error conditions

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NexusCircle.test.js

# Run with coverage
npx hardhat coverage

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

---

## 📦 Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring (no feature/bug change)
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Simple feature
git commit -m "feat: add pool search functionality"

# Bug fix with scope
git commit -m "fix(frontend): resolve MetaMask connection issue"

# With body
git commit -m "feat: implement collateral liquidation

Add automatic collateral liquidation when member defaults.
Includes FTSO price feed integration for fair market value.

Closes #123"

# Breaking change
git commit -m "feat!: change pool creation API

BREAKING CHANGE: Pool creation now requires explicit collateral parameter"
```

### Commit Best Practices

- One logical change per commit
- Write clear, descriptive messages
- Use present tense ("add" not "added")
- Keep subject line under 50 characters
- Reference issues when applicable

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with main

### PR Title Format

Use same format as commit messages:

```
feat: add pool filtering functionality
fix: resolve wallet connection timeout
docs: update setup instructions
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran and how to reproduce them.

- [ ] Test A
- [ ] Test B

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally with my changes

## Screenshots (if applicable)

Add screenshots to demonstrate UI changes.
```

### Review Process

1. **Automated Checks**: CI/CD runs tests
2. **Code Review**: At least one maintainer reviews
3. **Feedback**: Address all comments and suggestions
4. **Approval**: PR approved by maintainer
5. **Merge**: Maintainer merges to main

### After Merge

- Delete your feature branch
- Update your local main branch
- Close any related issues

---

## 📁 Project Structure

Understanding the project structure helps you navigate and contribute effectively:

```
nexusbank-mvp/
├── contracts/              # Solidity smart contracts
│   ├── NexusCircle.sol    # Main ROSCA contract
│   ├── FTSOPriceReader.sol
│   └── interfaces/        # Contract interfaces
│
├── scripts/                # Deployment & utility scripts
│   ├── deployment/        # Contract deployment
│   ├── testing/           # Test scripts
│   └── utils/             # Helper scripts
│
├── test/                   # Smart contract tests
│   └── NexusCircle.test.js
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Blockchain services
│   │   └── contracts/     # Contract ABIs
│   └── public/
│
├── docs/                   # Documentation
│   ├── POC.md             # Proof of Concept guide
│   ├── QUICK_START.md     # Quick start guide
│   ├── ARCHITECTURE.md    # Technical architecture
│   └── TROUBLESHOOTING.md # Common issues
│
├── .env.example           # Environment variables template
├── hardhat.config.js      # Hardhat configuration
├── package.json           # Backend dependencies
└── README.md              # Project overview
```

---

## 🎯 Contribution Ideas

### Good First Issues

- Add more frontend tests
- Improve error messages
- Update documentation
- Add code comments
- Fix typos
- Improve UI/UX

### Medium Complexity

- Add new pool filters
- Implement pool search
- Add transaction history
- Optimize gas usage
- Add loading states

### Advanced Features

- Implement FAssets integration
- Add automated round progression
- Build reputation system
- Create analytics dashboard
- Implement DAO governance

---

## 📞 Getting Help

### Resources

- **Documentation**: Check `docs/` folder
- **Existing Issues**: Search GitHub issues
- **Discussions**: GitHub Discussions tab

### Communication

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Features**: Create a Feature Request issue

### Response Time

- Issues: Usually within 2-3 days
- PRs: Usually within 3-5 days
- Questions: Usually within 1-2 days

---

## 🏆 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured on project website (if applicable)

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to NexusBank!** 🎉

Together, we're building the future of decentralized savings and credit.

---

*Last Updated: December 7, 2025*
