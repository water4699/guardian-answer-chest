"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Upload, FileText, Shield } from "lucide-react";
import { toast } from "sonner";
import { useExamVault } from "@/hooks/useExamVault";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useAccount } from "wagmi";
import { FloatingLocks } from "@/components/FloatingLocks";
import { WalletConnect } from "@/components/WalletConnect";

// localStorage key for storing original answers
const ANSWER_STORAGE_KEY = "examvault_answers";

// Helper to save original answer to localStorage
const saveOriginalAnswer = (examTitle: string, answer: string, timestamp: number) => {
  try {
    const stored = localStorage.getItem(ANSWER_STORAGE_KEY);
    const answers = stored ? JSON.parse(stored) : {};
    answers[`${examTitle}_${timestamp}`] = answer;
    localStorage.setItem(ANSWER_STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.error("Failed to save answer to localStorage:", e);
  }
};

export default function SubmitPage() {
  const [examTitle, setExamTitle] = useState("");
  const [answer, setAnswer] = useState("");

  const { isConnected } = useAccount();
  const {
    ethersSigner,
    chainId,
    ethersReadonlyProvider,
    provider: eip1193Provider,
    sameChain: _sameChainRef,
    sameSigner: _sameSignerRef,
  } = useMetaMaskEthersSigner();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const { instance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider,
    chainId,
    enabled: isConnected,
  });

  const {
    isSubmitting,
    message,
    isDeployed,
    submitAnswer: contractSubmitAnswer,
  } = useExamVault({
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain: _sameChainRef,
    sameSigner: _sameSignerRef,
  });

  const handleSubmit = async () => {
    if (!examTitle || !answer) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isDeployed) {
      toast.error("ExamVault contract not deployed on this network");
      return;
    }

    if (fhevmStatus !== "ready") {
      toast.error("FHEVM is not ready. Please wait...");
      return;
    }

    toast.info("Please sign the transaction", {
      description: "Confirm the transaction in your wallet to submit the exam",
    });

    try {
      // Save original answer to localStorage before submitting
      const timestamp = Math.floor(Date.now() / 1000);
      saveOriginalAnswer(examTitle, answer, timestamp);

      await contractSubmitAnswer(examTitle, answer);

      toast.success("Exam submitted successfully!", {
        description: "Your answer has been encrypted and stored on-chain",
      });
      setExamTitle("");
      setAnswer("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("user rejected") || errorMessage.includes("User denied")) {
        toast.error("Transaction cancelled", {
          description: "You cancelled the transaction",
        });
      } else {
        toast.error("Failed to submit exam", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-12">
      <FloatingLocks />

      <div className="container mx-auto px-4 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Encrypted Submission</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Submit Your Exam</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your answers will be encrypted using FHE technology and stored securely on the blockchain
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <WalletConnect />

            {/* Status Card */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className={isConnected ? "text-green-500" : "text-red-500"}>
                    {isConnected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">FHEVM</span>
                  <span className={fhevmStatus === "ready" ? "text-green-500" : "text-yellow-500"}>
                    {fhevmStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contract</span>
                  <span className={isDeployed ? "text-green-500" : "text-red-500"}>
                    {isDeployed ? "Deployed" : "Not Found"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-gradient-card border-border/50 shadow-float">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Exam Submission Form</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details below to submit your encrypted answer
                  </p>
                </div>
              </div>

              {message && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">{message}</p>
                </div>
              )}

              {isConnected && isDeployed === false && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    ExamVault contract not deployed on this network
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="exam-title">Exam Title</Label>
                  <Input
                    id="exam-title"
                    placeholder="e.g., Mathematics Final - Chapter 5"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Textarea
                    id="answer"
                    placeholder="Enter your exam answers here..."
                    className="min-h-[250px] resize-none"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 p-4 bg-secure/10 border border-secure/20 rounded-lg">
                  <Lock className="w-5 h-5 text-secure animate-lock-glow" />
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">End-to-end encrypted</span> - Your answers are
                    secured with FHE technology
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected || !isDeployed || fhevmStatus !== "ready"}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Lock className="w-5 h-5 mr-2 animate-spin" />
                      Encrypting & Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Submit Exam
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
