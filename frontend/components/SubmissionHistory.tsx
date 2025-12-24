"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Lock, Eye, EyeOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { useExamVault } from "@/hooks/useExamVault";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { useAccount } from "wagmi";

export const SubmissionHistory = () => {
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

  const {
    submissions,
    isRefreshing,
    decryptAnswer,
    refreshSubmissions,
  } = useExamVault({
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain: _sameChainRef,
    sameSigner: _sameSignerRef,
  });

  const handleDecrypt = async (submissionId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (fhevmStatus !== "ready") {
      toast.error("FHEVM is not ready. Please wait...");
      return;
    }

    // Show signing prompt
    toast.info("Please sign the decryption request", {
      description: "Confirm the signature in your wallet to decrypt the answer",
    });

    setDecryptingId(submissionId);

    try {
      const decrypted = await decryptAnswer(submissionId);
      if (decrypted) {
        setDecryptedAnswers((prev) => ({
          ...prev,
          [submissionId]: decrypted,
        }));
        // Only show success after decryption is complete
        toast.success("Answer decrypted successfully", {
          description: "The encrypted answer has been revealed",
        });
      } else {
        toast.error("Failed to decrypt answer");
      }
    } catch (error: unknown) {
      // Handle user rejection or decryption failure
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("user rejected") || errorMessage.includes("User denied")) {
        toast.error("Signature cancelled", {
          description: "You cancelled the signature request",
        });
      } else {
        toast.error("Decryption failed", {
          description: errorMessage,
        });
      }
    } finally {
      setDecryptingId(null);
    }
  };

  const handleToggleDecrypted = (submissionId: number) => {
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

  if (!isConnected) {
    return (
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="text-center py-8 text-muted-foreground">
          <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet to view submission history</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <FileText className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Submission History</h3>
            <p className="text-sm text-muted-foreground">
              Your encrypted exam submissions
            </p>
          </div>
        </div>
        <Button
          onClick={refreshSubmissions}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No submissions yet</p>
          <p className="text-sm mt-2">Submit your first exam to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-4 bg-background/50 rounded-lg border border-border/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">
                      {submission.examTitle}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(submission.timestamp)}</span>
                  </div>
                </div>
              </div>

              {decryptedAnswers[submission.id] ? (
                <div className="space-y-2">
                  <div className="p-3 bg-secure/10 border border-secure/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-semibold text-secure">
                        Decrypted Answer (Hash Value)
                      </p>
                      <Button
                        onClick={() => handleToggleDecrypted(submission.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground font-mono break-all">
                      {decryptedAnswers[submission.id]}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleDecrypt(submission.id)}
                  disabled={decryptingId === submission.id}
                  variant="outline"
                  size="sm"
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
  );
};
