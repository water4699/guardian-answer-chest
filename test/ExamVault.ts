import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ExamVault, ExamVault__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ExamVault")) as ExamVault__factory;
  const examVaultContract = (await factory.deploy()) as ExamVault;
  const examVaultContractAddress = await examVaultContract.getAddress();

  return { examVaultContract, examVaultContractAddress };
}

describe("ExamVault", function () {
  let signers: Signers;
  let examVaultContract: ExamVault;
  let examVaultContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    const { examVaultContract: contract, examVaultContractAddress: address } = await deployFixture();
    examVaultContract = contract;
    examVaultContractAddress = address;
  });

  it("should deploy successfully", async function () {
    const totalSubmissions = await examVaultContract.getTotalSubmissions();
    expect(totalSubmissions).to.eq(0);
  });

  it("should submit an encrypted exam answer", async function () {
    const examTitle = "Mathematics Final - Chapter 5";
    const answerValue = 42; // The answer to the exam (as a number)

    // Encrypt the answer as euint64
    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    // Submit the answer
    const tx = await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle, encryptedAnswer.handles[0], encryptedAnswer.inputProof);
    
    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;

    // Check submission count
    const totalSubmissions = await examVaultContract.getTotalSubmissions();
    expect(totalSubmissions).to.eq(1);

    // Get submission details
    const [student, title, timestamp, exists] = await examVaultContract.getSubmission(0);
    expect(student).to.eq(signers.alice.address);
    expect(title).to.eq(examTitle);
    expect(exists).to.be.true;
    expect(timestamp).to.be.gt(0);
  });

  it("should retrieve student submissions", async function () {
    const examTitle1 = "Physics Exam";
    const examTitle2 = "Chemistry Exam";
    const answerValue = 100;

    // Create encrypted input for first submission
    const encryptedAnswer1 = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    // Submit first answer
    await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle1, encryptedAnswer1.handles[0], encryptedAnswer1.inputProof);

    // Create encrypted input for second submission
    const encryptedAnswer2 = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue + 10)
      .encrypt();

    // Submit second answer
    await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle2, encryptedAnswer2.handles[0], encryptedAnswer2.inputProof);

    // Get Alice's submissions
    const aliceSubmissions = await examVaultContract.getStudentSubmissions(signers.alice.address);
    expect(aliceSubmissions.length).to.eq(2);
    expect(aliceSubmissions[0]).to.eq(0);
    expect(aliceSubmissions[1]).to.eq(1);
  });

  it("should decrypt the answer correctly", async function () {
    const examTitle = "Biology Exam";
    const answerValue = 85;

    // Encrypt the answer
    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    // Submit the answer
    const tx = await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle, encryptedAnswer.handles[0], encryptedAnswer.inputProof);
    await tx.wait();

    // Get the encrypted answer handle
    const encryptedAnswerHandle = await examVaultContract
      .connect(signers.alice)
      .getEncryptedAnswer(0);

    // Decrypt the answer
    const decryptedAnswer = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedAnswerHandle,
      examVaultContractAddress,
      signers.alice,
    );

    expect(decryptedAnswer).to.eq(answerValue);
  });

  it("should prevent unauthorized access to encrypted answers", async function () {
    const examTitle = "History Exam";
    const answerValue = 95;

    // Alice submits an answer
    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle, encryptedAnswer.handles[0], encryptedAnswer.inputProof);

    // Bob tries to access Alice's answer
    await expect(
      examVaultContract.connect(signers.bob).getEncryptedAnswer(0)
    ).to.be.revertedWith("Only the student can view their answer");
  });

  it("should reject empty exam title", async function () {
    const answerValue = 50;

    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    await expect(
      examVaultContract
        .connect(signers.alice)
        .submitAnswer("", encryptedAnswer.handles[0], encryptedAnswer.inputProof)
    ).to.be.revertedWith("Exam title cannot be empty");
  });

  it("should check if submission exists", async function () {
    const examTitle = "English Exam";
    const answerValue = 78;

    // Initially, submission 0 should not exist
    let exists = await examVaultContract.submissionExists(0);
    expect(exists).to.be.false;

    // Submit an answer
    const encryptedAnswer = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(answerValue)
      .encrypt();

    await examVaultContract
      .connect(signers.alice)
      .submitAnswer(examTitle, encryptedAnswer.handles[0], encryptedAnswer.inputProof);

    // Now submission 0 should exist
    exists = await examVaultContract.submissionExists(0);
    expect(exists).to.be.true;
  });

  it("should handle multiple students submitting answers", async function () {
    const aliceExam = "Alice's Math Exam";
    const bobExam = "Bob's Math Exam";
    const aliceAnswer = 90;
    const bobAnswer = 88;

    // Alice submits
    const aliceEncrypted = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.alice.address)
      .add64(aliceAnswer)
      .encrypt();

    await examVaultContract
      .connect(signers.alice)
      .submitAnswer(aliceExam, aliceEncrypted.handles[0], aliceEncrypted.inputProof);

    // Bob submits
    const bobEncrypted = await fhevm
      .createEncryptedInput(examVaultContractAddress, signers.bob.address)
      .add64(bobAnswer)
      .encrypt();

    await examVaultContract
      .connect(signers.bob)
      .submitAnswer(bobExam, bobEncrypted.handles[0], bobEncrypted.inputProof);

    // Verify total submissions
    const totalSubmissions = await examVaultContract.getTotalSubmissions();
    expect(totalSubmissions).to.eq(2);

    // Verify Alice's submissions
    const aliceSubmissions = await examVaultContract.getStudentSubmissions(signers.alice.address);
    expect(aliceSubmissions.length).to.eq(1);

    // Verify Bob's submissions
    const bobSubmissions = await examVaultContract.getStudentSubmissions(signers.bob.address);
    expect(bobSubmissions.length).to.eq(1);

    // Verify Alice can decrypt her answer
    const aliceEncryptedHandle = await examVaultContract
      .connect(signers.alice)
      .getEncryptedAnswer(0);
    const aliceDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceEncryptedHandle,
      examVaultContractAddress,
      signers.alice,
    );
    expect(aliceDecrypted).to.eq(aliceAnswer);

    // Verify Bob can decrypt his answer
    const bobEncryptedHandle = await examVaultContract
      .connect(signers.bob)
      .getEncryptedAnswer(1);
    const bobDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobEncryptedHandle,
      examVaultContractAddress,
      signers.bob,
    );
    expect(bobDecrypted).to.eq(bobAnswer);
  });
});
