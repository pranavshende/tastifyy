# Tastifyy Platform Functionality & Logic

*Cross-Reference: This document contains specific functional logic rules, external integrations, and behavior specifications for the platform. See `architecture.md` for system design.*

## Payment Gateway: Razorpay Route & RazorpayX
Tastifyy uses Razorpay as its core payment aggregator to handle marketplace transactions, specifically utilizing **Razorpay Route** for split payments (escrow) and **RazorpayX** for business payouts.

### 1. How Razorpay Knows Who to Pay (Razorpay Route)
Razorpay Route uses a system called **Linked Accounts** to manage marketplace splits.
1. **Onboarding:** When a restaurant signs up on Tastifyy, we collect their bank details. The backend calls the Razorpay API to create a "Linked Account" for them.
2. **Account ID:** Razorpay verifies their bank details and returns a unique ID (e.g., `acc_rest12345`). We save this `razorpay_account_id` in our Supabase database under that restaurant's profile.
3. **The Transaction (Escrow & Split):** When a customer buys food, the backend creates a Razorpay order with a specific "Transfer" parameter. We tell Razorpay: *"Process this ₹500 payment. Once successful, transfer ₹350 to `acc_rest12345` and keep the remaining ₹150 in the Tastifyy master account."*
4. Because we pass that unique `account_id` with every single order programmatically, Razorpay Route handles the escrow and split automatically.

### 2. Paying Delivery Partners (RazorpayX)
Delivery Partners do not receive instant splits per transaction. Instead, their earnings accumulate in our database.
- We store the Delivery Partner's bank account details (Account Number + IFSC) in our database.
- When it's payday (e.g., weekly), the backend triggers a payout via the **RazorpayX API**. 
- The API sends the accumulated amount directly from Tastifyy's current account to the delivery partner's bank account via IMPS/NEFT.

### 3. Fee Structure & Charges (Unit Economics)
Razorpay's pricing must be factored into Tastifyy's platform fee and restaurant commission:
- **Standard PG Charges:** ~2.00% + 18% GST (effectively ~2.36%) on the total transaction amount to collect the money.
- **Razorpay Route (Splits):** Typically free on standard startup plans (bundled with the 2% PG fee).
- **RazorpayX (Payouts):** Flat fee per transaction out to Delivery Partners (e.g., ~₹2 for NEFT, ~₹5 for IMPS). 

*Example Economics:*
- Customer pays: ₹500
- PG Fee (2.36%): -₹11.80
- Net enters ecosystem: ₹488.20
- Route sends to Restaurant: -₹350.00
- Tastifyy retains: ₹138.20
- Weekly Payout to Rider: -₹50.00 (plus ₹2 IMPS fee)
- Tastifyy Net Take-Home: ₹86.20
