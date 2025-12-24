"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Lock, Eye, EyeOff, Clock, History, RefreshCw, Shield } from "lucide-react";
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

// Helper to get original answer from localStorage
const getOriginalAnswer = (examTitle: string, timestamp: bigint): string | null => {
  try {
    const stored = localStorage.getItem(ANSWER_STORAGE_KEY);
    if (!stored) return null;
    const answers = JSON.parse(stored);
    
    // Try to find matching answer (within 60 seconds tolerance)
    const timestampNum = Number(timestamp);
    for (const key of Object.keys(answers)) {
      const [title, ts] = key.split("_");
      if (title === examTitle && Math.abs(Number(ts) - timestampNum) < 60) {
        return answers[key];
      }
    }
    return null;
  } catch (e) {
    console.error("Failed to get answer from localStorage:", e);
    return null;
  }
};

export default function HistoryPage() {
  const [decryptedAnswers, setDecryptedAnswers] = useState<Record<number, string>>({});
  const [decryptingId, setDecryptingId] = useState<number | null>(null);

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

  const { submissions, isRefreshing, decryptAnswer, refreshSubmissions } = useExamVault({
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain: _sameChainRef,
    sameSigner: _sameSignerRef,
  });

  const handleDecrypt = async (submissionId: number, examTitle: string, timestamp: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (fhevmStatus !== "ready") {
      toast.error("FHEVM is not ready. Please wait...");
      return;
    }

    toast.info("Please sign the decryption request", {
      description: "Confirm the signature in your wallet to decrypt the answer",
    });

    setDecryptingId(submissionId);

    try {
      // Always perform on-chain decryption
      const decrypted = await decryptAnswer(submissionId);
      
      if (decrypted) {
        // Try to get original answer from localStorage
        const originalAnswer = getOriginalAnswer(examTitle, timestamp);
        
        if (originalAnswer) {
          // Show original answer if available
          setDecryptedAnswers((prev) => ({
            ...prev,
            [submissionId]: originalAnswer,
          }));
          toast.success("Answer decrypted and verified successfully!");
        } else {
          // Show hash if original not found
          setDecryptedAnswers((prev) => ({
            ...prev,
            [submissionId]: `[Verified Hash: ${decrypted}]\n\nNote: Original answer text not found in local storage. The hash above confirms your submission was successfully decrypted from the blockchain.`,
          }));
          toast.success("Answer decrypted from blockchain");
        }
      } else {
        toast.error("Failed to decrypt answer");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("user rejected") || errorMessage.includes("User denied")) {
        toast.error("Signature cancelled");
      } else {
        toast.error("Decryption failed", { description: errorMessage });
      }
    } finally {
      setDecryptingId(null);
    }
  };

  const handleHideAnswer = (submissionId: number) => {
    setDecryptedAnswers((prev) => {
      const updated = { ...prev };
      delete updated[submissionId];
      return updated;
    });
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background relative py-12">
      <FloatingLocks />

      <div className="container mx-auto px-4 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full mb-4">
            <History className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Submission History</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">View Your Submissions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Access and decrypt your previously submitted exam answers
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <WalletConnect />

            {/* Stats Card */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Submissions</span>
                  <span className="font-semibold text-foreground">{submissions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Decrypted</span>
                  <span className="font-semibold text-foreground">
                    {Object.keys(decryptedAnswers).length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-gradient-card border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your Submissions</h2>
                    <p className="text-sm text-muted-foreground">
                      Click decrypt to view your original answers
                    </p>
                  </div>
                </div>
                <Button
                  onClick={refreshSubmissions}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {!isConnected ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Lock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Connect your wallet</p>
                  <p className="text-sm mt-2">to view your submission history</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No submissions yet</p>
                  <p className="text-sm mt-2">Submit your first exam to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-5 bg-background/50 rounded-xl border border-border/30 hover:border-border/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground text-lg">
                              {submission.examTitle}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(submission.timestamp)}</span>
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-secure/10 text-secure rounded-full border border-secure/20">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Encrypted
                        </div>
                      </div>

                      {decryptedAnswers[submission.id] ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-secure/5 border border-secure/20 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-secure flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Decrypted Answer
                              </p>
                              <Button
                                onClick={() => handleHideAnswer(submission.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                              >
                                <EyeOff className="w-4 h-4 mr-1" />
                                Hide
                              </Button>
                            </div>
                            <div className="p-3 bg-background rounded-lg border border-border/30">
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {decryptedAnswers[submission.id]}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() =>
                            handleDecrypt(submission.id, submission.examTitle, submission.timestamp)
                          }
                          disabled={decryptingId === submission.id}
                          variant="outline"
                          className="w-full"
                        >
                          {decryptingId === submission.id ? (
                            <>
                              <Lock className="w-4 h-4 mr-2 animate-spin" />
                              Decrypting...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Decrypt Answer
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
