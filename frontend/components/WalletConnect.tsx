"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
    toast.success("Wallet connected successfully");
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info("Wallet disconnected");
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Wallet className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Wallet</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>
        {isConnected && (
          <CheckCircle2 className="w-6 h-6 text-secure" />
        )}
      </div>
      
      {isConnected && address && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Connected Address</p>
          <p className="text-sm font-mono text-foreground break-all">{address}</p>
        </div>
      )}

      <Button
        onClick={isConnected ? handleDisconnect : handleConnect}
        variant={isConnected ? "outline" : "default"}
        className="w-full"
      >
        {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
      </Button>
    </Card>
  );
};
