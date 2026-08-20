# CampusCart Payments & Monetization Upgrade Plan

> **Status:** Planning / Not yet implemented  
> **Purpose:** Long-term reference for implementing CampusCart's paid features without disrupting the free marketplace experience.

---

## 1. Product Principle

CampusCart should remain fundamentally free for students.

The monetization model should follow:

> **Free to participate. Pay for additional visibility, selling power, business exposure, and eventually transaction infrastructure.**

Do **not** charge users simply to create ordinary listings.

Paid features should provide clear, measurable value.

---

# 2. Monetization Roadmap

Implement monetization progressively rather than launching everything at once.

### Phase 1 — Listing Promotion

Priority: **Highest**

- Listing Boosts
- Super Boosts
- Featured Listings
- Urgent Sale promotion
- Sponsored placement in search/category feeds
- Relist + Boost

### Phase 2 — Seller Monetization

- Seller Pro subscription
- Premium seller profiles
- Seller storefronts
- Advanced seller analytics
- Seller promotion bundles

### Phase 3 — Business Advertising

- Sponsored listings
- CampusCart Ads
- Sponsored categories
- Sponsored deals
- Campus-specific advertising
- Event/campaign sponsorships

### Phase 4 — Commerce Infrastructure

- CampusCart Checkout
- Transaction fees
- Delivery
- Seller payouts
- Refunds/disputes
- Order management

---

# 3. Listing Boost System

## 3.1 Basic Boost

A seller pays to temporarily increase the visibility of an existing listing.

Possible benefits:

- Higher ranking in relevant feeds
- Higher ranking in search results
- "Boosted" indicator
- Increased exposure for a fixed duration

Suggested initial durations:

- 24 hours
- 3 days
- 7 days

The actual pricing should be determined after collecting usage and conversion data.

### Required data

Each boost should store:

- `id`
- `listing_id`
- `seller_id`
- `type`
- `status`
- `price`
- `currency`
- `started_at`
- `expires_at`
- `created_at`
- `payment_id`
- `impressions`
- `clicks`

---

# 4. Featured Listings

Featured listings should appear in premium placements such as:

- CampusCart homepage
- Category pages
- Search results
- Campus-specific sections
- Featured marketplace carousel

Example UI:

> 🔥 Featured Listings

Paid listings should still be clearly labelled as sponsored/featured content.

Do not make paid placement misleading.

---

# 5. Promotion Types

Recommended promotion products:

| Product | Purpose |
|---|---|
| Boost | Increase listing visibility |
| Super Boost | Stronger and longer visibility |
| Featured | Homepage/category exposure |
| Urgent Sale | Adds urgency-focused visual treatment |
| Relist + Boost | Refreshes an old listing and promotes it |
| Seller Spotlight | Promotes a seller/storefront |
| Deal Spotlight | Promotes a discount/deal |

Avoid creating too many products initially.

Start with:

1. Boost
2. Featured
3. Seller Pro

---

# 6. Seller Pro

Seller Pro should be a recurring subscription for users who sell frequently.

Potential features:

- Increased listing limits
- Advanced analytics
- Premium seller profile
- Storefront
- Discounted boosts
- Additional photos/media
- Seller verification
- Promotion tools
- Faster listing processing
- Sales statistics
- Saved promotional campaigns

Example tiers:

## Free

- Basic seller profile
- Limited active listings
- Standard visibility
- Basic statistics

## Seller Pro

Potential monthly price:

**K30–K50/month**

Potential features:

- 50+ active listings
- Advanced analytics
- Storefront
- Discounted boosts
- Premium profile
- Seller badge
- Promotion tools

Pricing should remain configurable and should not be hard-coded throughout the application.

---

# 7. Seller Storefronts

Premium sellers should eventually be able to have a dedicated CampusCart storefront.

Example:

`campuscart.social/store/seller-name`

Storefront components:

- Seller logo
- Banner
- Seller description
- Verification status
- Products
- Categories
- Contact options
- Seller ratings
- Store statistics
- Deals/promotions

Free sellers can have a basic profile.

Paid sellers can receive enhanced storefront functionality.

---

# 8. Seller Analytics

Basic analytics should remain free.

Example:

- Listing views
- Messages
- Saves

Premium analytics could include:

- Views over time
- Click-through rate
- Message conversion
- Listing performance
- Best-performing products
- Best-performing categories
- Campus performance
- Promotion performance
- Boost ROI

Example:

```text
Listing Performance

Views                 1,243
Product clicks          317
Messages                 42
Saves                    28

Boost Performance

Paid views              640
Organic views           603
Boost clicks             89
```

---

# 9. Business Advertising

CampusCart can eventually support businesses that want to reach students.

Potential customers:

- Restaurants
- Clothing stores
- Phone shops
- Salons
- Barbers
- Gyms
- Tutors
- Printing businesses
- Local retailers
- Banks
- Telecom companies
- Student-focused services

Advertising products:

### Sponsored Listing

Business product/service appears in relevant marketplace areas.

### Banner Advertisement

Display advertising on selected CampusCart pages.

### Sponsored Category

Example:

> Electronics — Sponsored by XYZ Phones

### Sponsored Deal

Example:

> 🎉 20% Student Discount  
> Sponsored by XYZ Clothing

### Campus Campaign

Business sponsors a campaign targeted at a specific university/campus.

---

# 10. Campus Deals

Create a dedicated section for student discounts and promotions.

Example:

```text
🔥 Campus Deals

20% OFF
XYZ Clothing

K45 Student Meal
ABC Restaurant

K30 Haircut
Campus Barber
```

Businesses can pay to feature deals.

Potential monetization:

- Daily promotion
- Weekly promotion
- Featured deal
- Sponsored campaign

---

# 11. Advertising Targeting

Advertising should eventually support targeting by:

- Campus
- Category
- Student audience
- Location
- Campaign duration

Do not introduce invasive or unnecessary personal-data targeting.

Prefer contextual targeting:

> Electronics buyer → electronics advertisement

rather than excessive behavioural profiling.

---

# 12. Promotion Bundles

Eventually create bundles for sellers.

Example:

## Seller Growth Pack

Includes:

- 5 Boosts
- 1 Featured placement
- 7-day Seller Spotlight
- Analytics

Bundles should provide a better effective price than buying each promotion separately.

---

# 13. CampusCart Checkout

This should be a later-stage feature.

Current marketplace model:

```text
Buyer
  ↓
CampusCart
  ↓
Seller
  ↓
Payment arranged externally
```

Future model:

```text
Buyer
  ↓
CampusCart Checkout
  ↓
Payment Provider
  ↓
CampusCart
  ↓
Seller payout
```

CampusCart can eventually charge a transaction/platform fee.

---

# 14. Transaction Fees

Do not implement transaction fees until CampusCart controls or facilitates the payment flow.

Potential model:

```text
Item price:       K100
Platform fee:       K4
Seller receives:   K96
```

The exact fee should be configurable.

Possible fee models:

- Percentage
- Fixed fee
- Percentage + fixed fee
- Seller subscription discount

Avoid hard-coding the percentage.

---

# 15. Delivery

Future CampusCart delivery system:

```text
Buyer
  ↓
CampusCart Order
  ↓
Seller
  ↓
CampusCart Delivery
  ↓
Buyer
```

Potential delivery models:

### Campus delivery

Same-campus delivery.

### Inter-campus delivery

Delivery between universities/campuses.

### Local delivery

Delivery within supported areas.

Potential revenue:

```text
Customer delivery fee
        ↓
Driver payout
        ↓
CampusCart platform margin
```

CampusCart should not necessarily employ drivers directly.

Potential partners:

- Student delivery agents
- Local courier companies
- Independent riders

---

# 16. Payment Architecture

When paid features are eventually implemented, payment functionality should be isolated from the rest of the application.

Recommended conceptual architecture:

```text
Frontend
   ↓
Payment API
   ↓
Payment Provider
   ↓
Webhook
   ↓
Payment Service
   ↓
Database
   ↓
Feature Activation
```

Never activate paid features based solely on the frontend redirect.

The authoritative source should be a verified payment confirmation/webhook.

---

# 17. Payment Records

Create a central payment model rather than creating separate payment logic for every feature.

Example conceptual schema:

```text
payments

id
user_id
amount
currency
provider
provider_reference
status
purpose
metadata
created_at
updated_at
paid_at
```

Possible `purpose` values:

```text
listing_boost
featured_listing
seller_subscription
storefront_upgrade
advertisement
sponsored_deal
transaction_fee
delivery
```

---

# 18. Payment Statuses

Use explicit payment states.

Recommended:

```text
pending
processing
paid
failed
cancelled
refunded
partially_refunded
```

Never assume:

```text
payment created = payment successful
```

---

# 19. Idempotency

Payment processing must be idempotent.

If the same webhook is received multiple times:

> It must not activate the same promotion twice.

Use:

- Provider transaction/reference ID
- Internal payment ID
- Unique database constraints
- Webhook event IDs where available

---

# 20. Webhooks

All payment providers should use server-side webhook verification.

Flow:

```text
Payment Provider
      ↓
POST /api/payments/webhook
      ↓
Verify signature
      ↓
Check transaction
      ↓
Check idempotency
      ↓
Mark payment paid
      ↓
Activate purchased feature
```

Never trust:

- Query parameters
- Frontend success pages
- Client-side payment status
- User-submitted payment IDs

---

# 21. Promotion Activation

Example:

```text
User purchases Boost
        ↓
Payment created
        ↓
Payment provider checkout
        ↓
Provider confirms payment
        ↓
Webhook received
        ↓
Payment verified
        ↓
Boost activated
        ↓
expires_at calculated
        ↓
Listing ranking updated
```

---

# 22. Expiration

Paid promotions must automatically expire.

Use server-side expiration checks.

Example:

```text
boost.started_at
boost.expires_at
boost.status
```

A scheduled job can periodically:

1. Find expired promotions
2. Mark them expired
3. Remove premium ranking
4. Update listing visibility
5. Record analytics

Do not depend entirely on the client to expire promotions.

---

# 23. Ranking Algorithm

Paid promotion should influence ranking without completely destroying organic discovery.

Recommended conceptual ranking:

```text
final_score =
    organic_score
    + promotion_score
```

Possible organic signals:

- Relevance
- Recency
- Listing quality
- Seller reputation
- Engagement
- Availability

Promotion signals:

- Boost level
- Promotion type
- Remaining campaign time

Avoid allowing money to completely dominate search results.

Users should still be able to discover good organic listings.

---

# 24. Sponsored Content Labelling

Paid listings should be clearly identifiable.

Examples:

- Sponsored
- Featured
- Boosted
- Promoted

Do not make paid advertisements indistinguishable from normal organic listings.

---

# 25. Pricing Architecture

Do not hard-code prices in React components.

Bad:

```text
Boost = K10
```

Instead, use configurable products:

```text
promotion_products

id
name
type
price
currency
duration
active
metadata
created_at
updated_at
```

This allows pricing to change without rewriting the frontend.

---

# 26. Currency

CampusCart's primary market is Zambia.

Use:

```text
ZMW
```

Internally store monetary amounts in the smallest appropriate integer unit where supported by the payment provider.

Avoid floating-point arithmetic for money.

Example:

```text
amount = 10000
currency = ZMW
```

represents:

```text
K100.00
```

depending on the chosen monetary representation.

---

# 27. Refunds

Paid promotions and subscriptions should have a defined refund policy.

Potential cases:

- Payment succeeded but feature failed to activate
- Duplicate payment
- Technical error
- Advertisement rejected
- Seller account suspended
- Subscription cancellation

Refund logic should be server-side and tied to the original payment.

---

# 28. Abuse Prevention

Paid visibility can be abused.

Implement:

- Maximum active boosts
- Rate limiting
- Listing moderation
- Payment verification
- Fraud detection
- Suspicious payment detection
- Seller restrictions
- Refund abuse detection

A banned seller should not automatically retain unlimited paid advertising privileges.

---

# 29. Admin Dashboard

The admin dashboard should eventually provide:

### Payments

- Total revenue
- Successful payments
- Failed payments
- Refunds
- Revenue by product
- Revenue by date

### Promotions

- Active boosts
- Expired boosts
- Featured listings
- Promotion impressions
- Promotion clicks
- Promotion conversion

### Subscriptions

- Active subscriptions
- New subscriptions
- Cancellations
- Monthly recurring revenue

### Advertising

- Active campaigns
- Campaign revenue
- Impressions
- Clicks

---

# 30. Revenue Analytics

Track:

```text
Gross Revenue
Net Revenue
Refunds
Payment Fees
Platform Revenue
```

Useful metrics:

### ARPU

Average Revenue Per User.

### ARPPU

Average Revenue Per Paying User.

### MRR

Monthly Recurring Revenue.

### Conversion Rate

Percentage of users who become paying users.

### Promotion Conversion

Percentage of promoted listings resulting in meaningful engagement.

---

# 31. Recommended Initial Launch

Do NOT launch every monetization feature simultaneously.

Initial monetization should be:

### Free

- Create account
- Browse listings
- Search
- Contact sellers
- Create normal listings
- Basic seller profile
- Basic analytics

### Paid

**1. Boost Listing**

**2. Featured Listing**

**3. Seller Pro**

That's enough to validate whether CampusCart users are willing to pay.

---

# 32. Suggested Implementation Order

```text
1. Payment abstraction/service
        ↓
2. Payment database model
        ↓
3. Payment provider integration
        ↓
4. Webhook processing
        ↓
5. Product/pricing system
        ↓
6. Listing Boost
        ↓
7. Featured Listings
        ↓
8. Promotion expiration
        ↓
9. Promotion analytics
        ↓
10. Seller Pro
        ↓
11. Seller storefronts
        ↓
12. Business advertising
        ↓
13. Sponsored Deals
        ↓
14. CampusCart Checkout
        ↓
15. Transaction fees
        ↓
16. Delivery
```

---

# 33. UX Principles

Paid features should feel like upgrades, not paywalls.

Good:

> 🚀 Get more eyes on your listing

Bad:

> Pay to continue using CampusCart

Good:

> Your listing received 27 views. Boost it to reach more buyers.

Bad:

> Buy Boost now!

The system should communicate the value of the purchase.

---

# 34. Future Monetization Ideas

Potential future products:

- Seller verification
- Premium seller badges
- Storefront themes
- Business pages
- Campus ambassador promotions
- Campus event sponsorships
- Featured university sections
- Student discount campaigns
- Affiliate partnerships
- Delivery commissions
- Payment processing fees
- Seller lead generation
- Sponsored search
- Promotional notifications
- Promotional email campaigns

These should only be implemented once CampusCart has enough traffic to make them valuable.

---

# 35. Important Rule

Do not optimize CampusCart for extracting the maximum amount of money from each student.

Optimize for:

```text
More buyers
     ↓
More sellers
     ↓
More transactions
     ↓
More demand for visibility
     ↓
More sellers willing to pay
     ↓
More businesses wanting student exposure
     ↓
More CampusCart revenue
```

The marketplace's liquidity is more valuable than early monetization.

---

# 36. Definition of Success

The monetization system should eventually allow CampusCart to generate revenue from four major sources:

```text
                    CAMPUSCART REVENUE
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   SELLER TOOLS        ADVERTISING       TRANSACTIONS
        │                  │                  │
   Boosts             Business Ads       Checkout
   Featured           Sponsored Deals   Commission
   Seller Pro         Campaigns         Delivery
   Storefronts
```

The long-term goal is to make CampusCart a **campus commerce platform**, not simply a classified-listing website.

---

## Implementation Checklist

### Payment Foundation

- [ ] Create centralized payment model
- [ ] Create payment service
- [ ] Select/confirm payment provider
- [ ] Implement checkout creation
- [ ] Implement webhook verification
- [ ] Implement idempotency
- [ ] Implement payment status handling
- [ ] Implement refunds
- [ ] Add payment audit logging

### Promotions

- [ ] Create promotion product model
- [ ] Create listing promotion model
- [ ] Build Boost purchase flow
- [ ] Build Featured purchase flow
- [ ] Implement promotion expiration
- [ ] Add sponsored labels
- [ ] Update listing ranking
- [ ] Add promotion analytics
- [ ] Add seller promotion history

### Seller Pro

- [ ] Create subscription model
- [ ] Create subscription checkout
- [ ] Handle renewals
- [ ] Handle cancellation
- [ ] Handle failed payments
- [ ] Gate Pro features server-side
- [ ] Add seller analytics
- [ ] Add premium storefront

### Business Advertising

- [ ] Create advertiser/business model
- [ ] Create campaign model
- [ ] Create ad placement system
- [ ] Add targeting
- [ ] Add campaign scheduling
- [ ] Add campaign analytics
- [ ] Add admin approval
- [ ] Add billing

### Future Commerce

- [ ] CampusCart Checkout
- [ ] Order system
- [ ] Seller payouts
- [ ] Transaction fees
- [ ] Refund system
- [ ] Dispute system
- [ ] Delivery system
- [ ] Driver management

---

## Final Product Vision

CampusCart should eventually evolve from:

> **A free marketplace for students**

into:

> **A campus commerce platform where students buy and sell, sellers operate storefronts, and businesses reach university audiences.**

Monetization should grow naturally with that evolution.
