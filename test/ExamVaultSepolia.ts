import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ExamVault } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ExamVault on Sepolia", function () {
  let deployer: HardhatEthersSigner;
  let examVaultContract: ExamVault;
  let examVaultContractAddress: string;

  before(async function () {
    // Skip if not on Sepolia
    if (fhevm.isMock) {
      console.warn(`This test suite is for Sepolia Testnet only`);
      this.skip();
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    deployer = ethSigners[0];

    // Get the deployed contract address from deployments
    const ExamVaultDeployment = await ethers.getContract("ExamVault");
    examVaultContractAddress = await ExamVaultDeployment.getAddress();
    examVaultContract = ExamVaultDeployment as ExamVault;

    console.log("ExamVault contract address:", examVaultContractAddress);
    console.log("Deployer address:", deployer.address);
  });

  it("should be deployed on Sepolia", async function () {
    expect(examVaultContractAddress).to.not.be.undefined;
    expect(examVaultContractAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should submit an encrypted exam answer on Sepolia", async function () {
    const examTitle = "Sepolia Test Exam - Mathematics";
    const answerValue = 99;

    // Get initial submission count
    const initialCount = await examVaultContract.getTotalSubmissions();

    // Encrypt the answer as euint64
    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, deployer.address)
      .add64(answerValue)
      .encrypt();

    console.log("Submitting encrypted answer...");

    // Submit the answer
    const tx = await examVaultContract
      .connect(deployer)
      .submitAnswer(examTitle, encryptedAnswer.handles[0], encryptedAnswer.inputProof);
    
    const receipt = await tx.wait();
    console.log("Transaction hash:", receipt?.hash);
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Check submission count increased
    const newCount = await examVaultContract.getTotalSubmissions();
    expect(newCount).to.eq(initialCount + 1n);

    // Get submission details
    const submissionId = newCount - 1n;
    const [student, title, timestamp, exists] = await examVaultContract.getSubmission(submissionId);
    
    expect(student).to.eq(deployer.address);
    expect(title).to.eq(examTitle);
    expect(exists).to.be.true;
    expect(timestamp).to.be.gt(0);

    console.log("Submission created successfully!");
    console.log("Submission ID:", submissionId.toString());
    console.log("Student:", student);
    console.log("Title:", title);
    console.log("Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
  });

  it("should retrieve student submissions on Sepolia", async function () {
    const studentSubmissions = await examVaultContract.getStudentSubmissions(deployer.address);
    
    console.log("Total submissions for deployer:", studentSubmissions.length);
    expect(studentSubmissions.length).to.be.gt(0);

    // Display all submissions
    for (let i = 0; i < studentSubmissions.length; i++) {
      const submissionId = studentSubmissions[i];
      const [student, title, timestamp, exists] = await examVaultContract.getSubmission(submissionId);
      
      console.log(`\nSubmission ${i + 1}:`);
      console.log("  ID:", submissionId.toString());
      console.log("  Title:", title);
      console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
      console.log("  Exists:", exists);
    }
  });

  it("should get encrypted answer handle on Sepolia", async function () {
    const studentSubmissions = await examVaultContract.getStudentSubmissions(deployer.address);
    
    if (studentSubmissions.length === 0) {
      console.log("No submissions found, skipping test");
      this.skip();
    }

    const submissionId = studentSubmissions[0];
    
    // Get the encrypted answer handle
    const encryptedAnswerHandle = await examVaultContract
      .connect(deployer)
      .getEncryptedAnswer(submissionId);

    expect(encryptedAnswerHandle).to.not.be.undefined;
    console.log("Successfully retrieved encrypted answer handle for submission:", submissionId.toString());
  });

  it("should check submission existence on Sepolia", async function () {
    const totalSubmissions = await examVaultContract.getTotalSubmissions();
    
    if (totalSubmissions > 0n) {
      const exists = await examVaultContract.submissionExists(0);
      expect(exists).to.be.true;
      console.log("Submission 0 exists:", exists);
    }

    // Check non-existent submission
    const nonExistentId = totalSubmissions + 100n;
    const notExists = await examVaultContract.submissionExists(nonExistentId);
    expect(notExists).to.be.false;
    console.log(`Submission ${nonExistentId} exists:`, notExists);
  });
});
