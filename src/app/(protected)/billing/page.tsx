"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCheckoutSession } from "@/lib/stripe";
import { api } from "@/trpc/react";
import { Info, CreditCard, Loader2, Sparkles } from "lucide-react";
import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const BillingContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const utils = api.useUtils();
  const { data: user } = api.project.getMyCredits.useQuery();
  const [creditsToBuy, setCreditsToBuy] = React.useState<number[]>([100]);
  const [isLoading, setIsLoading] = React.useState(false);
  const creditsToBuyAmount = creditsToBuy[0]!;
  const price = ((creditsToBuyAmount / 50) * 75).toFixed(2);

  // Handle success redirect from Stripe
  React.useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true") {
      toast.success("Payment successful! Your credits have been added to your account.");
      // Refetch credits to show updated amount
      utils.project.getMyCredits.invalidate();
      // Clean up URL
      router.replace("/billing", { scroll: false });
    } else if (canceled === "true") {
      toast.info("Payment was canceled. You can try again anytime.");
      // Clean up URL
      router.replace("/billing", { scroll: false });
    }
  }, [searchParams, router, utils]);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      await createCheckoutSession(creditsToBuyAmount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Billing & Credits
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
          Manage your credits and purchase more to continue using Dionysus
        </p>
      </motion.div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Enhanced Current Credits Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="border-border/70 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-glow-cyan-sm transition-all duration-300 h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl">Current Credits</CardTitle>
                  <CardDescription className="text-sm">Available credits in your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {user?.credits ?? 0}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground font-medium">credits remaining</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Purchase Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="border-border/70 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-glow-cyan-sm transition-all duration-300 h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl">Purchase Credits</CardTitle>
                  <CardDescription className="text-sm">Buy credits to index your repositories</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="credits-slider" className="text-sm font-semibold text-foreground">
                      Credits
                    </label>
                    <span className="text-base sm:text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                      {creditsToBuyAmount} credits
                    </span>
                  </div>
                  <Slider
                    id="credits-slider"
                    value={creditsToBuy}
                    onValueChange={setCreditsToBuy}
                    min={10}
                    max={1000}
                    step={10}
                    className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary-foreground"
                    aria-label="Select number of credits to purchase"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>10</span>
                    <span>1000</span>
                  </div>
                </div>

                <motion.div
                  className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground font-medium">Total Price</span>
                    <span className="text-3xl sm:text-4xl font-bold text-primary">₹{price}</span>
                  </div>
                </motion.div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                aria-label={`Purchase ${creditsToBuyAmount} credits for ₹${price}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                    Purchase {creditsToBuyAmount} Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/5 shadow-lg">
          <CardContent className="pt-6 sm:pt-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/20 p-3 flex-shrink-0">
                <Info className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-3 text-sm sm:text-base">
                <p className="text-foreground font-semibold text-base sm:text-lg">
                  How Credits Work
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Each credit allows you to index 1 file in a repository. For example,
                  if your project has 100 files, you will need 100 credits to index it.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Free Tier:</strong> New users receive 150 free credits to get started.
                </p>
                <p className="text-muted-foreground leading-relaxed">
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

const BillingPage = () => {
  return (
    <Suspense fallback={
      <div className="space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Billing & Credits
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
            Manage your credits and purchase more to continue using Dionysus
          </p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
};

export default BillingPage;
