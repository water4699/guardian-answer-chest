"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useExamVault } from "@/hooks/useExamVault";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useAccount } from "wagmi";

export const ExamSubmission = () => {
  const [examTitle, setExamTitle] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  
  const { isConnected } = useAccount();
  const { 
    ethersSigner, 
    chainId, 
    ethersReadonlyProvider, 
    provider: eip1193Provider,
    sameChain: _sameChainRef,
    sameSigner: _sameSignerRef 
  } = useMetaMaskEthersSigner();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  
  const { instance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider,
    chainId,
    enabled: isConnected,
  });

  // Use the refs from the hook directly

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

    // Show signing prompt
    toast.info("Please sign the transaction", {
      description: "Confirm the transaction in your wallet to submit the exam",
    });

    try {
      await contractSubmitAnswer(examTitle, answer);
      
      // Only show success after transaction is confirmed
      toast.success("Exam submitted successfully", {
        description: "Your answer has been encrypted and stored on-chain",
      });
      setExamTitle("");
      setAnswer("");
    } catch (error: unknown) {
      // Handle user rejection or transaction failure
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
    <Card className="p-8 bg-gradient-card border-border/50 shadow-float">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Submit Exam</h2>
          <p className="text-sm text-muted-foreground">
            Your answers will be encrypted and timestamped on-chain
          </p>
        </div>
        {!isConnected && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Connect wallet to submit</span>
          </div>
        )}
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

      {isConnected && fhevmStatus !== "ready" && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm text-foreground">
            Initializing FHE encryption... ({fhevmStatus})
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Your Answer</Label>
          <Textarea
            id="answer"
            placeholder="Enter your exam answers here..."
            className="min-h-[300px] resize-none"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 p-4 bg-secure/10 border border-secure/20 rounded-lg">
          <Lock className="w-5 h-5 text-secure animate-lock-glow" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">End-to-end encrypted</span> - Your answers are secured with blockchain technology
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Lock className="w-4 h-4 mr-2 animate-spin" />
              Encrypting & Submitting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Exam
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
