"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { ExamVaultAddresses } from "@/abi/ExamVaultAddresses";
import { ExamVaultABI } from "@/abi/ExamVaultABI";

export type SubmissionType = {
  id: number;
  student: string;
  examTitle: string;
  timestamp: bigint;
  exists: boolean;
  error?: string;
};

export type DecryptedSubmissionType = {
  id: number;
  examTitle: string;
  answer: string | bigint;
};

type ExamVaultInfoType = {
  abi: typeof ExamVaultABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

/**
 * Resolves ExamVault contract metadata for the given EVM `chainId`.
 */
function getExamVaultByChainId(
  chainId: number | undefined
): ExamVaultInfoType {
  if (!chainId) {
    return { abi: ExamVaultABI.abi };
  }

  const entry =
    ExamVaultAddresses[chainId.toString() as keyof typeof ExamVaultAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ExamVaultABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: ExamVaultABI.abi,
  };
}

/**
 * Hook for interacting with the ExamVault contract
 */
export const useExamVault = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // States
  const [submissions, setSubmissions] = useState<SubmissionType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const examVaultRef = useRef<ExamVaultInfoType | undefined>(undefined);
  const isSubmittingRef = useRef<boolean>(isSubmitting);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);

  // ExamVault contract info
  const examVault = useMemo(() => {
    const c = getExamVaultByChainId(chainId);
    examVaultRef.current = c;

    if (!c.address) {
      setMessage(`ExamVault deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!examVault) {
      return undefined;
    }
    return Boolean(examVault.address) && examVault.address !== ethers.ZeroAddress;
  }, [examVault]);

  // Refresh submissions
  const refreshSubmissions = useCallback(async () => {
    console.log("[useExamVault] refreshSubmissions()");
    if (isRefreshingRef.current || !examVaultRef.current?.address || !ethersReadonlyProvider || !ethersSigner) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = examVaultRef.current.chainId;
    const thisExamVaultAddress = examVaultRef.current.address;

    const examVaultContract = new ethers.Contract(
      thisExamVaultAddress,
      examVaultRef.current.abi,
      ethersReadonlyProvider
    );

    try {
      // Get student submissions
      const submissionIds = await examVaultContract.getStudentSubmissions(ethersSigner.address);
      
      const submissionsData: SubmissionType[] = await Promise.all(
        submissionIds.map(async (id: bigint) => {
          const [student, examTitle, timestamp, exists] = await examVaultContract.getSubmission(id);
          return {
            id: Number(id),
            student,
            examTitle,
            timestamp,
            exists,
          };
        })
      );

      if (
        sameChain.current(thisChainId) &&
        thisExamVaultAddress === examVaultRef.current?.address
      ) {
        setSubmissions(submissionsData);
      }

      isRefreshingRef.current = false;
      setIsRefreshing(false);
    } catch (e) {
      setMessage("Failed to load submissions: " + e);
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [ethersReadonlyProvider, ethersSigner, sameChain]);

  // Auto refresh submissions when connected
  useEffect(() => {
    if (ethersSigner && examVault.address) {
      refreshSubmissions();
    }
  }, [ethersSigner, examVault.address, refreshSubmissions]);

  // Submit answer
  const submitAnswer = useCallback(
    async (examTitle: string, answerText: string) => {
      if (isSubmittingRef.current) {
        return;
      }

      if (!examVault.address || !instance || !ethersSigner || !examTitle || !answerText) {
        return;
      }

      const thisChainId = chainId;
      const thisExamVaultAddress = examVault.address;
      const thisEthersSigner = ethersSigner;
      const thisExamVaultContract = new ethers.Contract(
        thisExamVaultAddress,
        examVault.abi,
        thisEthersSigner
      );

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage("Encrypting answer...");

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisExamVaultAddress !== examVaultRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          // Convert answer text to a number (hash it for simplicity)
          const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answerText));
          const answerValue = BigInt(answerHash) % BigInt(2 ** 63); // Keep within uint64 range

          // Encrypt the answer
          const input = instance.createEncryptedInput(
            thisExamVaultAddress,
            thisEthersSigner.address
          );
          input.add64(Number(answerValue));

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Submit cancelled");
            throw new Error("Submit cancelled: context changed");
          }

          setMessage("Submitting to blockchain...");

          // Call contract
          const tx = await thisExamVaultContract.submitAnswer(
            examTitle,
            enc.handles[0],
            enc.inputProof
          );

          setMessage(`Waiting for transaction: ${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Exam submitted successfully! Status: ${receipt?.status}`);

          if (isStale()) {
            setMessage("Submit completed but data is stale");
            return;
          }

          // Refresh submissions
          await refreshSubmissions();
        } catch (e) {
          setMessage("Submit failed: " + e);
          throw e; // Re-throw to let component handle the error
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      };

      return run(); // Return the promise so caller can await
    },
    [
      ethersSigner,
      examVault.address,
      examVault.abi,
      instance,
      chainId,
      refreshSubmissions,
      sameChain,
      sameSigner,
    ]
  );

  // Decrypt answer
  const decryptAnswer = useCallback(
    async (submissionId: number): Promise<string | null> => {
      if (isDecryptingRef.current) {
        return null;
      }

      if (!examVault.address || !instance || !ethersSigner) {
        return null;
      }

      const thisChainId = chainId;
      const thisExamVaultAddress = examVault.address;
      const thisEthersSigner = ethersSigner;

      isDecryptingRef.current = true;
      setIsDecrypting(true);
      setMessage("Starting decryption...");

      try {
        const isStale = () =>
          thisExamVaultAddress !== examVaultRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        // Ensure we use checksum address format
        const contractAddressChecksum = ethers.getAddress(thisExamVaultAddress);
        console.log("[useExamVault] Decrypting with contract address:", contractAddressChecksum);
        console.log("[useExamVault] User address:", thisEthersSigner.address);

        // Get decryption signature
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [contractAddressChecksum],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return null;
        }

        if (isStale()) {
          setMessage("Decryption cancelled");
          return null;
        }

        setMessage("Requesting encrypted handle (sending tx)...");

        // 1) Send a transaction to re-authorize decryption on-chain
        const examVaultContract = new ethers.Contract(
          thisExamVaultAddress,
          examVault.abi,
          thisEthersSigner
        );

        const tx = await examVaultContract.requestDecryption(submissionId);
        setMessage(`Waiting for decryption authorization tx: ${tx.hash}...`);
        await tx.wait();

        // 2) After authorization, read the encrypted handle via view call
        setMessage("Fetching encrypted handle...");
        const encryptedHandle = await examVaultContract.getEncryptedAnswer(
          submissionId
        );

        setMessage("Decrypting...");

        console.log("[useExamVault] Encrypted handle:", encryptedHandle);
        console.log("[useExamVault] Contract addresses in sig:", sig.contractAddresses);

        // Decrypt - use the same checksum address and the encrypted handle
        const res = await instance.userDecrypt(
          [{ handle: encryptedHandle, contractAddress: contractAddressChecksum }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("Decryption completed!");

        if (isStale()) {
          setMessage("Decryption completed but data is stale");
          return null;
        }

        return String(res[encryptedHandle]);
      } catch (e) {
        setMessage("Decryption failed: " + e);
        return null;
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    },
    [
      fhevmDecryptionSignatureStorage,
      ethersSigner,
      examVault.address,
      examVault.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  return {
    contractAddress: examVault.address,
    submissions,
    isSubmitting,
    isRefreshing,
    isDecrypting,
    message,
    isDeployed,
    submitAnswer,
    decryptAnswer,
    refreshSubmissions,
  };
};
