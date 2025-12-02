"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function createCheckoutSession(credits: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${credits} Dionysus Credits`,
          },
          unit_amount: Math.round((credits / 2) * 3 * 100),
        },
        quantity: 1,
      },
    ],
    customer_creation: "always",
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?canceled=true`,
    client_reference_id: userId.toString(),
    metadata: {
      credits,
    },
  });

  return redirect(session.url!);
}
