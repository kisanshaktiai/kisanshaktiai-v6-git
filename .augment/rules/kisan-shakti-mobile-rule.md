---
type: "always_apply"
---

# KisanShaktiAI V6 Mobile App - Augment Code Rule File

## Intent
This comprehensive rule file governs the design, development, and operational best practices for the KisanShaktiAI V6 mobile application. The platform serves over 10 million farmers across India with a multi-tenant SaaS architecture supporting multiple tenant types including AgriCompany, Dealer, NGO, Government, University, SugarFactory, Cooperative, and Insurance.

---

## Rules

### 1. Mobile Architecture
- Use a clean, modular architecture with clear separation of layers:
  - Presentation (screens, view models)
  - Domain (use cases)
  - Data (repositories)
  - Platform (networking, local storage)
- Enforce tenant context as a required parameter on all data-access calls.
- Implement offline-first data handling strategies:
  - Local normalized caching for farmers, products, tenant branding, feature flags.
  - Mutation queue with robust retry logic, exponential backoff, and idempotency keys.
  - Conflict resolution using last-write-wins for non-critical data, server authority for critical data, and explicit merge UI dialogs where necessary.
- Enable telemetry and tracing for network calls, cache hits/misses, and sync status to monitor scale and network issues.
- Use defensive JSON parsing and version-tolerant schema validation on backend payloads.

### 2. Multi-Tenant Guardrails
- All API requests must include tenant_id explicitly (path/header).
- Reject or log responses lacking tenant correlation context.
- Maintain tenant-scoped local caches and secure storage; clear or re-key data on tenant switch.
- Prohibit UI merging of data across tenants except in explicit multi-tenant admin modes.
- Always fetch and apply tenant branding, feature flags, and product catalogs dynamically per active tenant session.
- When farmers belong to multiple tenants, retain independent tenant-scoped profiles locally and in UI.

### 3. Identity and Authentication
- Implement phone-based login optimized for low literacy users:
  - Numeric keypad defaults, large call-to-action buttons.
  - Friendly retry flows for connectivity issues.
- Store minimal personally identifiable information; only key identifiers needed for access.
- Attach tenant_id and farmer_id to all AI interaction logs, applying redaction on free text containing PII.
- Keep separate authentication state per tenant; switching tenants requires full re-login.
- Mark "no OTP required" flag strictly as a testing or internal mock environment feature; production must use backend-driven secure auth flows.

### 4. Branding and Localization
- Dynamically fetch and cache tenant_branding data on app startup and tenant changes.
- Support white-labelable UI components driven by tenant colors, logos, and app names.
- Implement a localization strategy that merges base language packs with tenant-specific language files.
- Support multilingual product catalogs with dynamic language selection and fallback.
- Ensure UI adheres to accessibility standards for contrast, font sizes, and tap target dimensions.

### 5. AI Interactions
- Every AI request must include:
  - tenant_id
  - snapshot of tenant_feature flags
  - farmer_id or anonymized hash
  - language and locale
  - device and network context  
- Persist ai_interactions with prompt and response text, timestamps, and relevant minimal metadata.
- Avoid logging sensitive or free-text PII unless absolutely required and with tenant consent.
- Respect tenant feature gating for AI chat, weather, marketplace, and analytics capabilities.
- Use offline AI models when configured; monitor ai-models version and degrade gracefully when unavailable.
- Provide UI affordances for users to report poor AI results or errors securely.

### 6. Networking and Sync
- Implement robust network retry strategies using exponential backoff with jitter.
- Use circuit breakers to avoid repeated failed attempts on flapping connectivity.
- Batch read and write operations to optimize data transfer.
- Support delta sync with timestamp/version-based fetching.
- Ensure mutation retries are idempotent by including unique operation IDs.
- Show last sync timestamps and offline/online status in UI prominently.
- Never block critical read UI loading waiting for full sync; use cached data instantly.

### 7. Performance and Footprint
- Optimize the app for entry-level Android devices common in rural areas:
  - Low memory consumption; avoid large in-memory data graphs.
  - Stream media and paginate long lists.
- Reduce APK size by lazy loading non-critical modules and assets.
- Cache images and logos with size caps and automatic eviction policies.
- Schedule background tasks respecting Android Doze and app standby modes to conserve battery.

### 8. Security and Compliance
- Encrypt sensitive tokens and local caches using tenant-scoped keys.
- Validate all incoming intents and deep links; sanitize all inputs rigorously.
- Only log non-sensitive analytics data by default; redact all free-text fields prior to logging or transport.
- Include tamper detection and device environment checks to disable features on compromised or jailbroken devices.
- Apply zero-trust principles between app screens and components with strictly enforced access controls.

### 9. UX for Field Operations
- Design with large tap targets (minimum 48dp) and high-contrast color palettes for outdoor readability.
- Limit navigation depth to three or fewer levels; favor simple, straight-line workflows.
- Indicate offline vs live data clearly; offer manual refresh and a queue of pending actions.
- Make language toggle UI element always accessible and remember tenant-specific language preferences.
- Provide quick-access shortcuts for common tasks such as product lookup, weather info, and AI chat queries.

### 10. Observability and Quality
- Measure and log screen load times, data sync durations, AI interaction latencies, and error rates by tenant and network class.
- Develop comprehensive end-to-end tests simulating tenant switching, multi-language rendering, and offline behaviors.
- Use tenant-specific feature flag rollouts and kill switches to control new functionality deployments safely.
- Collect anonymized device hardware and network characteristics to tailor performance optimizations.

### 11. API Contracts and Versioning
- Use explicit API versions and forward-compatibility by ignoring unknown fields.
- Feature detect tenant feature flags dynamically rather than hard-coding toggles in the client.
- Provide compatibility fallback layers for deprecated endpoint fields; handle server-driven schema migrations gracefully.

### 12. Coding Standards (Mobile)
- Use Kotlin with Jetpack Compose on Android; SwiftUI on iOS; enforce type-safe and tested client models.
- Ensure repository and service interfaces accept tenant_id as a mandatory scope parameter.
- Avoid global or singleton states that obscure tenant context.
- Write small, testable functions with clear naming and doc comments describing tenant scoping, feature flags, and offline behaviors.
- Implement linting rules to prevent network calls missing tenant_id headers or other required metadata.

---

## Application Scope
These rules apply universally across all development, code generation, reviews, and architectural decisions for the KisanShaktiAI V6 mobile app, ensuring consistency, security, and scalability for the platform’s multi-tenant ecosystem.

---

## Usage Instructions
To apply these rules in the Augment Code environment, save this file as:

`.augment/rules/kisan-shakti-mobile-rule.md`

Reference the rule file in conversations or prompts with:

`@kisan-shakti-mobile-rule.md`

Combine with explicit @file or @docs context to guide code generation, review, and architecture guidance for mobile development.

---
