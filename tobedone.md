# tobedone.md

## Remaining Improvements

### 1. Admin UI Polish

* Remove unnecessary tabs
* Keep only Gate Scan flow

### 2. Payment Gateway (Test)

* Integrate test payment flow before mint

### 3. Authentication Upgrade

* Google Sign-in
* MetaMask login
* Use Clerk

### 4. User Web UI Polish

* Improve UX
* Better loading states
* Clean ticket view

### 5. Ticket Optimization (CRITICAL)

Problem:

* `/api/tickets/my-tickets` is slow

Cause:

* Scanning blockchain events each time

Solution Ideas:

* Cache token_ids in DB
* Maintain mapping: wallet -> token_ids
* Update on mint + transfer
* Avoid full chain scan

---
