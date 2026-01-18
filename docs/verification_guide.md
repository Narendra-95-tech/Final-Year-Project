# How to Verify Your "Real" Payment System

We have upgraded your platform with robust "Production Grade" reliability. Here is how to test it completely on `localhost`.

## 1. Verify Card Payments & Real-time Webhooks (The Easy Way)
Since `localhost` requires special tools (Stripe CLI) to receive real internet events, I have created a **Smart Simulation Script** that lets you verify the entire flow **without installing anything**.

### Step A: Setup
Add a test secret to your `.env` file (if you haven't already):
```bash
STRIPE_WEBHOOK_SECRET=whsec_test_secret
```

### Step B: The Test
1.  **Go to your App:** Create a booking for any listing/dhaba, proceed to payment, but **STOP** at the payment page.
2.  **Open a New Terminal:** Run this command:
    ```bash
    node scripts/tools/simulate_webhook.js
    ```
3.  **Watch the Magic:** 
    - The script will find your "Pending" booking.
    - It will send a valid, signed "Payment Success" signal to your server.
    - Your browser (if on the "Processing" page) effectively would flip to success, or your database will update instantly to `Confirmed`.

## 2. Verify UPI Payments (Manual Flow)
This tests the full "Manual Verification" flow which is common in Indian apps.

1.  **Book anything.**
2.  Select **Pay with UPI**.
3.  Enter a Mock UTR number (e.g. `123456789012`).
4.  Click **Confirm**.
5.  **Result:** You should see a success animation and receive a confirmation Receipt Email.

## 3. (Advanced) Real Stripe CLI
If you want to use the official Stripe CLI tool instead of my script:
1.  Download Stripe CLI from [stripe.com](https://stripe.com/docs/stripe-cli).
2.  Run `stripe listen --forward-to localhost:8080/webhook`.
3.  Process a real test-card payment on your UI.

## 4. Production Setup (Render)
Since you are deployed at `https://wanderlust-5bx8.onrender.com`:

1.  **Go to Stripe Dashboard**: Developers > Webhooks.
2.  **Add Endpoint**:
    - **Endpoint URL**: `https://wanderlust-5bx8.onrender.com/webhook`
    - **Events to listen for**: `checkout.session.completed`, `charge.refunded`
3.  **Get the Key**: Click "Add endpoint", then on the next screen, reveal the **Signing secret** (starts with `whsec_...`).
4.  **Add to Render**:
    - Go to your Render Dashboard > Settings > Environment Variables.
    - Add Key: `STRIPE_WEBHOOK_SECRET`
    - Value: `whsec_...` (the key you just copied).
    - **Save Changes** (Render will restart your app automatically).

