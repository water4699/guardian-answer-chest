import { FloatingLocks } from "@/components/FloatingLocks";
import { Shield, Lock, Clock, Upload, History, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <FloatingLocks />
      
      {/* Hero Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secure/10 border border-secure/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-secure" />
            <span className="text-sm font-medium text-secure">Blockchain-Powered Security</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Integrity Through <span className="text-primary">Encryption</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Submit exam answers with confidence. Every submission is encrypted, timestamped, 
            and stored on-chain for complete transparency and anti-cheating protection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/submit"
              className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              <Upload className="w-5 h-5" />
              Submit Exam
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-8 py-4 border-2 border-primary/30 text-foreground rounded-lg font-semibold hover:bg-primary/10 transition-all"
            >
              <History className="w-5 h-5" />
              View History
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Encrypted Submissions",
                description: "End-to-end FHE encryption ensures your answers remain private until decryption"
              },
              {
                icon: Clock,
                title: "Timestamped Proof",
                description: "Blockchain timestamps provide immutable proof of submission time"
              },
              {
                icon: Shield,
                title: "Transparent Process",
                description: "Full visibility for students and teachers with verifiable records"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-card rounded-xl border border-border/50 shadow-float hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                description: "Connect your MetaMask wallet to authenticate and sign transactions"
              },
              {
                step: "2",
                title: "Submit Answer",
                description: "Enter your exam title and answer. The system encrypts it using FHE"
              },
              {
                step: "3",
                title: "Verify & Decrypt",
                description: "View your submission history and decrypt answers when needed"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
