import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/payhere-hash
 * Computes the PayHere payment hash server-side so the merchant_secret never
 * leaves this process. Must NOT be exposed to the browser directly.
 *
 * Hash formula (PayHere docs):
 *   MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!secret || secret === "your_sandbox_merchant_secret_here") {
    return NextResponse.json(
      { error: "PAYHERE_MERCHANT_SECRET not configured" },
      { status: 500 },
    );
  }

  let body: { merchant_id: string; order_id: string; amount: string; currency: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { merchant_id, order_id, amount, currency } = body;
  if (!merchant_id || !order_id || !amount || !currency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hashedSecret = crypto.createHash("md5").update(secret).digest("hex").toUpperCase();
  const rawHash = `${merchant_id}${order_id}${amount}${currency}${hashedSecret}`;
  const hash = crypto.createHash("md5").update(rawHash).digest("hex").toUpperCase();

  return NextResponse.json({ hash });
}
