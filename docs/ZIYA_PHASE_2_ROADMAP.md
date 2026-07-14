# Ziya Phase 2 Roadmap: Context-Aware Health Behavior Layer

## Purpose

This document captures the next major direction for Ziya after the first product layer is complete.

Phase 1 makes Ziya a strong product scanner:

- Product scanning
- Manual barcode lookup
- Search
- Ingredient intelligence
- Additive and concern detection
- Common ingredient atlas
- Multilingual ingredient classification
- Regional product search
- Profile preferences
- Personal alerts
- Today’s Plate
- Supabase sync
- Google/email sign-in
- Better Matches / Smart Swaps
- Professional UI polish

Phase 2 should make Ziya more than a scanner.

The long-term goal is for Ziya to become a **context-aware health behavior assistant** that understands what the user is doing in real life and helps them make better decisions without forcing perfection.

Core idea:

> Ziya should not only understand products.  
> It should understand the user’s real-life context, goals, restaurants, habits, receipts, meals, and weekly patterns.

---

## Phase 2 Identity

Phase 1:

> Scan products and understand labels.

Phase 2:

> Understand what the user is doing in real life and help them make better choices without forcing perfection.

This means Ziya should become aware of:

- Location context
- Gym visits
- Restaurant visits
- Fast-food patterns
- Meal photos
- Receipts
- Menu items
- Daily goals
- Weekly goals
- Long-term goals
- User behavior trends
- Goal-compatible choices

Ziya should feel practical, realistic, and intelligent. It should not become a judgmental diet app.

---

## Core Product Principle

Ziya should not say:

- “Never eat this.”
- “You failed.”
- “Fast food is always bad.”
- “This is safe.”
- “This is healthy.”
- “This is forbidden.”

Ziya should say things like:

- “This can still fit your week.”
- “This pushes you over your current goal.”
- “This is a better match for your goal today.”
- “Want help choosing the best option here?”
- “You’re still on track if the rest of the day stays lighter.”
- “This supports your weekly pattern.”
- “This may need verification.”

The core behavioral model:

> Help the user make better choices without requiring perfection.

---

## Major Phase 2 Features

## 1. Location-Aware Rewards

Ziya could use optional location permission to recognize positive behavior.

Example:

- User goes to the gym.
- Ziya detects the location context.
- Ziya logs a workout visit or asks the user to confirm.
- Ziya rewards the behavior in the weekly/long-term goal system.

Potential message:

> Gym visit detected.  
> Nice work. This counts toward your weekly activity goal.

This creates a “proven by location” layer. The app does not only rely on the user saying they worked out; it can support habit tracking through location context when permission is granted.

Important notes:

- Location should be optional.
- The user must explicitly opt in.
- Ziya should explain why location is used.
- Location should support the user, not surveil them.
- The app should avoid creepy or overly frequent notifications.

---

## 2. Location-Aware Food Nudges

Ziya could recognize when a user is at or near a restaurant, grocery store, fast-food place, gym, cafe, or health-focused restaurant.

Examples:

### Fast-food place

Instead of a harsh warning:

> You’re near McDonald’s. This can still fit your week if you keep it within your goal. Want help choosing the best option?

### Healthier restaurant

> This looks like a good match for your current goals. Want to log this meal?

### Grocery store

> Want to scan products for your weekly goal before buying?

This makes Ziya proactive, but still realistic.

Important rule:

> Fast food should not be automatically forbidden. It should be evaluated against the user’s weekly and long-term goals.

---

## 3. Fast Food Can Be Allowed if It Fits the Goal

Ziya should allow flexible eating.

The app should understand:

- One meal does not ruin the week.
- A fast-food meal can fit a calorie/protein/sugar/sodium goal.
- The issue is the pattern, not a single event.
- Users are more likely to keep using the app if it feels realistic.

Possible messages:

> This fits your weekly goal.

> This is okay today, but watch sodium later.

> This meal pushes your weekly fast-food goal close to the limit.

> This choice is high in sodium, but your calories still fit today.

> Want a better option from this restaurant?

This is important because Ziya should not become a guilt app.

---

## 4. Seed Oil Scout-Style Restaurant Intelligence

Ziya could eventually understand restaurant-level and menu-level ingredient patterns.

Inspired direction:

- Restaurant intelligence
- Menu item analysis
- Cooking oil awareness
- Ingredient estimation
- Better menu choices
- Goal-compatible meals
- Seed oil / additive / processing awareness when evidence exists

Example:

> Restaurant detected: Chick-fil-A  
> Common preparation may include refined seed oils.  
> Want to compare menu options?

Or:

> This meal is higher in protein and lower in sugar than most options here.

Important rule:

Ziya should avoid unsupported claims. Restaurant ingredient data should be shown with evidence level:

- Confirmed menu data
- Restaurant-published nutrition
- User receipt/photo match
- Estimated from menu item
- Unknown / needs verification

---

## 5. Food Photo and Receipt Scan

Ziya could let the user take a picture of:

- Food
- Receipt
- Menu
- Takeout bag
- Restaurant order screen
- Nutrition board
- Grocery receipt

Then Ziya can try to match it to:

- Restaurant
- Menu item
- Product
- Estimated nutrition
- Ingredients/allergens if available
- Today’s Plate entry
- Weekly goal impact

Receipt scanning may be more reliable than food-photo guessing because receipts often contain item names.

Example flow:

1. User takes photo of receipt.
2. Ziya extracts item names.
3. Ziya matches items to restaurant menu data.
4. Ziya estimates nutrition.
5. Ziya asks user to confirm.
6. Ziya logs the meal to Today’s Plate or Weekly Goals.

Important rule:

Photo/receipt recognition should not pretend certainty. Use wording like:

- “Matched with high confidence.”
- “Possible match.”
- “Needs confirmation.”
- “Could not identify this item confidently.”

---

## 6. Weekly Goals

Today’s Plate already handles daily goals.

Phase 2 should introduce weekly goals because real behavior works better over a week than a single day.

Examples:

- Stay under a weekly fast-food limit.
- Hit protein goal 5 days this week.
- Keep added sugar under a weekly target.
- Keep sodium under a weekly target.
- Go to the gym 3 times this week.
- Avoid Red 40 for 14 days.
- Reduce soda intake over the month.
- Scan groceries before buying 3 times this week.
- Choose a better restaurant option twice this week.

Weekly goals prevent the app from being too rigid.

Example:

> You went over sodium today, but your weekly average is still on track.

This is more realistic than treating every day as pass/fail.

---

## 7. Long-Term Goals

Long-term goals should sit above daily and weekly goals.

Examples:

- Reduce soda over 30 days.
- Avoid a specific additive for 14 days.
- Improve grocery choices over a month.
- Increase protein consistency.
- Reduce fast-food visits over 8 weeks.
- Build a gym routine.
- Improve average product quality over time.
- Reduce high-sugar snacks gradually.

Long-term goals should focus on progress and consistency, not perfection.

Example message:

> Your fast-food visits are down 20% compared to last month.

Or:

> You hit your protein target 5 days this week. That supports your long-term muscle-building goal.

---

## 8. Today’s Plate Expansion

Today’s Plate should stay simple but eventually connect to weekly and long-term goals.

Current role:

> What did I eat today?

Future role:

> How does today affect my week and my long-term direction?

Potential additions:

- “Today”
- “This week”
- “Trends”
- “Goal streaks”
- “Flexible allowance”
- “Restaurant meals”
- “Scanned products”
- “Receipt meals”

Important: Do not clutter the daily view. Weekly and long-term progress should be separate or progressively disclosed.

---

## 9. Behavior-Aware Nudges

Ziya can use context to provide nudges.

Examples:

### At a gym

> Gym visit detected. This supports your weekly activity goal.

### At a fast-food place

> This can still fit your week. Want help picking the best option?

### At a grocery store

> Want to scan a few items before checkout?

### Repeated pattern

> You scanned high-sugar drinks three times this week. Want to set a lower-sugar goal?

### Positive trend

> You picked lower-sugar options twice this week.

Important rule:

Nudges should be helpful, not annoying.

Nudges should be:

- Optional
- Low-frequency
- Goal-aware
- Non-judgmental
- Easy to dismiss
- Privacy-conscious

---

## 10. Goal-Compatible Fast Food

Ziya should eventually allow a restaurant/fast-food flow:

1. User enters or detects restaurant.
2. Ziya identifies menu options.
3. User selects or scans receipt.
4. Ziya compares options against current goals.
5. Ziya recommends the best fit.

Example:

> Best match for your current week: grilled chicken sandwich, no fries, water.  
> Higher protein, lower sugar, and fits your weekly calorie range.

Or:

> This order fits your calorie goal but is high in sodium. Consider lighter sodium choices later today.

This turns fast food into a manageable choice instead of a forbidden category.

---

## 11. Restaurant/Menu Item Intelligence

Future data sources might include:

- Restaurant-published nutrition pages
- Menu APIs if available
- User-submitted receipts
- OCR from menus/receipts
- Public nutrition datasets
- Manual curated restaurant entries
- User corrections
- Restaurant-specific ingredient disclosures

Ziya should classify confidence:

- Confirmed restaurant nutrition
- Matched from receipt
- Estimated from menu
- User-confirmed
- Unknown

Do not show estimated restaurant data as exact truth.

---

## 12. Privacy and Permission Principles

Location and food-photo features are sensitive.

Rules:

- Location must be optional.
- User must understand what it is used for.
- Ziya should not constantly track without purpose.
- Notifications must be opt-in.
- Photos/receipts should not be uploaded without user consent.
- Sensitive data should be stored carefully.
- Clear data controls should exist later:
  - delete location history
  - delete meal history
  - clear receipt scans
  - export data
  - disable contextual nudges

Ziya should feel trustworthy.

---

## 13. Suggested Phase 2 Architecture

Potential modules later:

```text
src/data/locationContextTypes.js
src/data/restaurantGoalRules.js
src/lib/locationContextDetector.js
src/lib/restaurantMatcher.js
src/lib/receiptParser.js
src/lib/menuItemMatcher.js
src/lib/weeklyGoalEngine.js
src/lib/longTermGoalEngine.js
src/lib/contextualNudgeEngine.js
src/lib/goalFitAnalyzer.js
```

Potential future API routes:

```text
api/restaurant/search.js
api/receipt/parse.js
api/menu/match.js
api/goals/sync.js
```

Do not build these during Phase 1 unless explicitly requested.

---

## 14. Suggested Phase 2 Order

Phase 2 should not be built all at once.

Recommended order:

### Phase 2A — Weekly and Long-Term Goals

Build goal framework above Today’s Plate.

- Weekly goals
- Long-term goals
- Flexible allowance
- Progress tracking
- Simple goal summaries

### Phase 2B — Restaurant / Fast Food Manual Flow

Before using location, build manual restaurant logging.

- Search restaurant
- Choose menu item
- Add to Today’s Plate
- Check goal fit
- Suggest better options

### Phase 2C — Receipt Scan

Add receipt photo/OCR.

- Extract restaurant
- Extract items
- Match to known menu items
- Ask user to confirm
- Log to Today’s Plate / Weekly Goals

### Phase 2D — Optional Location Context

Only after manual restaurant/goal systems work.

- Gym detection
- Restaurant detection
- Grocery store detection
- Context-aware prompts
- Optional notifications

### Phase 2E — Behavior-Aware Nudges

Use the goal system and context to produce smart, low-frequency nudges.

- Positive reinforcement
- Fast-food goal fit
- Weekly trend feedback
- Restaurant recommendations

---

## 15. Why This Makes Ziya Stand Out

Most scanner apps do one of these:

- Barcode scanning
- Product scoring
- Additive warnings
- Nutrition tracking

Ziya can stand out by connecting all of them to real behavior:

- What the user scans
- What the user eats
- Where the user is
- What goals they set
- What choices they repeat
- What they can do better next time

This makes Ziya feel personal and practical.

Core differentiator:

> Ziya does not only judge products.  
> It helps the user navigate real-life choices.

---

## 16. Do Not Build This Yet During Current Passes

This document is a roadmap/context file.

Do not mix Phase 2 ideas into current Phase 1 implementation prompts unless explicitly requested.

Current Phase 1 should finish:

- Regional product search
- Multilingual ingredient canonicalization
- Search deduping
- Smooth scan result sheet
- Professional UI polish
- Better Matches / Smart Swaps
- Today’s Plate/Profile polish
- Final QA

After Phase 1 is stable, Phase 2 can begin.

---

## Summary

Phase 2 direction:

> Context-aware health behavior layer:  
> location, goals, restaurants, receipts, food photos, weekly patterns, long-term progress, and smart nudges.

Ziya should help users make better choices in real life without demanding perfection.
