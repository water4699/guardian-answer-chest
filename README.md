# 🔐 Guardian Answer Chest

> A privacy-preserving exam answer submission system powered by Fully Homomorphic Encryption (FHE)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://guardian-answer-chest.vercel.app/)
[![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue?style=for-the-badge)](LICENSE)
[![FHEVM](https://img.shields.io/badge/Powered%20by-FHEVM-purple?style=for-the-badge)](https://docs.zama.ai/fhevm)

## 🎯 Overview

Guardian Answer Chest is a decentralized application that enables students to submit exam answers with complete privacy using Fully Homomorphic Encryption (FHE). Built on Zama's FHEVM protocol, it ensures that answers remain encrypted on-chain and can only be decrypted by authorized parties.

### 🎥 Demo Video

[Watch the demo video](./demo.mp4)

### 🌐 Live Demo

**Try it now:** [https://guardian-answer-chest.vercel.app/](https://guardian-answer-chest.vercel.app/)

## ✨ Key Features

- **🔒 End-to-End Encryption**: Exam answers are encrypted using FHE and remain encrypted on the blockchain
- **🎓 Student Privacy**: Only the student who submitted can decrypt their own answers
- **📝 Exam Management**: Submit answers to multiple exams with titles and timestamps
- **🔍 Submission History**: View all your past submissions with encrypted data
- **⚡ Real-time Decryption**: Decrypt your answers on-demand using the FHEVM SDK
- **🌐 Multi-Network Support**: Works on both Sepolia testnet and local Hardhat networks
- **🎨 Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
guardian-answer-chest/
├── contracts/
│   ├── ExamVault.sol        # Main FHE-enabled exam vault contract
│   └── FHECounter.sol       # Example FHE counter contract
├── frontend/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── ExamSubmission.tsx
│   │   ├── ExamList.tsx
│   │   ├── SubmissionHistory.tsx
│   │   └── GradeTimeline.tsx
│   ├── fhevm/              # FHEVM integration hooks
│   ├── hooks/              # Custom React hooks
│   └── abi/                # Contract ABIs and addresses
├── deploy/                 # Deployment scripts
├── test/                   # Contract tests
│   ├── ExamVault.ts
│   └── ExamVaultSepolia.ts
├── tasks/                  # Hardhat custom tasks
└── hardhat.config.ts       # Hardhat configuration
```

## 🛠️ Technology Stack

### Smart Contracts
- **FHEVM**: Fully Homomorphic Encryption for Ethereum
- **Solidity**: Smart contract programming language
- **Hardhat**: Development environment and testing framework

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful UI components
- **@zama-fhe/relayer-sdk**: FHEVM client SDK
- **ethers.js**: Ethereum library

## 📜 Available Scripts

### Backend (Smart Contracts)

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |
| `npm run node`     | Start local Hardhat node |

### Frontend

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run dev`      | Start development server |
| `npm run build`    | Build for production     |
| `npm run start`    | Start production server  |
| `npm run genabi`   | Generate contract ABIs   |

## 🎓 How It Works

1. **Submit Answer**: Students connect their wallet and submit encrypted exam answers
2. **On-Chain Storage**: Answers are stored encrypted on the blockchain using FHE
3. **Privacy Guaranteed**: Only the student who submitted can request decryption
4. **Secure Decryption**: Decryption happens client-side using the FHEVM SDK
5. **View History**: Students can view all their submissions and decrypt them anytime

## 🔐 Smart Contract: ExamVault

The `ExamVault` contract provides the following functionality:

- `submitAnswer()`: Submit an encrypted exam answer with exam title
- `getSubmission()`: Get submission metadata (without decrypted answer)
- `getStudentSubmissions()`: Get all submission IDs for a student
- `requestDecryption()`: Request decryption authorization for your answer
- `getTotalSubmissions()`: Get total number of submissions

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [@zama-fhe/relayer-sdk Documentation](https://docs.zama.ai/protocol/relayer-sdk-guides/)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/DeanGrey99/guardian-answer-chest/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 👥 Authors

- **DeanGrey99** - Frontend Development
- **PoppySaxton** - Smart Contract Development

---

**Built with ❤️ using FHEVM by Zama**
