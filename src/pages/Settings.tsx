import { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { CreditCard, ShieldCheck } from "lucide-react";

export function Settings() {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [paypalConnected, setPaypalConnected] = useState(false);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Settings & Integrations</h1>
        <p className="text-vault-gray">Manage your account and payment gateways.</p>
      </div>

      <div className="space-y-8 max-w-3xl">
        {/* Payment Integrations */}
        <div className="bg-vault-card border border-vault-border rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-vault-border pb-4">
            Payment Gateways
          </h2>
          <p className="text-vault-gray mb-6 text-sm">
            Connect your payment provider to automatically generate secure Vault links upon successful checkout.
          </p>

          <div className="space-y-4">
            {/* Stripe */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-vault-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center font-bold text-[#635BFF] text-xl">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    Stripe 
                    {stripeConnected && <ShieldCheck className="w-4 h-4 text-vault-accent" />}
                  </h3>
                  <p className="text-xs text-vault-gray">Credit Cards, Apple Pay, Google Pay</p>
                </div>
              </div>
              <Button 
                variant={stripeConnected ? "outline" : "primary"} 
                onClick={() => setStripeConnected(!stripeConnected)}
              >
                {stripeConnected ? "Disconnect" : "Connect Stripe"}
              </Button>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-vault-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00457C] rounded-md flex items-center justify-center font-bold text-white text-xl shadow-inner">
                  P
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    PayPal 
                    {paypalConnected && <ShieldCheck className="w-4 h-4 text-vault-accent" />}
                  </h3>
                  <p className="text-xs text-vault-gray">Global payments & Wallets</p>
                </div>
              </div>
              <Button 
                variant={paypalConnected ? "outline" : "primary"} 
                onClick={() => setPaypalConnected(!paypalConnected)}
              >
                {paypalConnected ? "Disconnect" : "Connect PayPal"}
              </Button>
            </div>
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
}
