"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCheckoutSession } from "@/lib/stripe";
import { api } from "@/trpc/react";
import { Info, CreditCard, Loader2, Sparkles } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

const BillingPage = () => {
  const { data: user } = api.project.getMyCredits.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isLoading, setIsLoading] = React.useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;
  const price = ((creditsToBuyAmount / 50) * 75).toFixed(2);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      await createCheckoutSession(creditsToBuyAmount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground">
          Manage your credits and purchase more to continue using Dionysus
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Credits Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Current Credits</CardTitle>
                  <CardDescription>Available credits in your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {user?.credits ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">credits remaining</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Purchase Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Purchase Credits</CardTitle>
                  <CardDescription>Buy credits to index your repositories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Credits</label>
                    <span className="text-sm font-semibold text-primary">
                      {creditsToBuyAmount} credits
                    </span>
                  </div>
                  <Slider
                    value={creditsToBuy}
                    onValueChange={setCreditsToBuy}
                    min={10}
                    max={1000}
                    step={10}
                    className="[&_[role=slider]]:bg-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10</span>
                    <span>1000</span>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Price</span>
                    <span className="text-2xl font-bold text-primary">₹{price}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase {creditsToBuyAmount} Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="text-foreground font-medium">
                  How Credits Work
                </p>
                <p className="text-muted-foreground">
                  Each credit allows you to index 1 file in a repository. For example,
                  if your project has 100 files, you will need 100 credits to index it.
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Free Tier:</strong> New users receive 60 free credits to get started.
                </p>
                <p className="text-muted-foreground">
                  Credits are consumed when you create a new project. Make sure you have
                  enough credits before linking a repository.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BillingPage;
