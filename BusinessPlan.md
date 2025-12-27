# Food Rush - Business Plan

## Project Vision

Food Rush is a multiplayer delivery racing game that serves multiple strategic purposes:

1. **Learning sandbox** for web app operations, payments, and monitoring
2. **Portfolio piece** for MobileWest (mobile release engineering & monitoring company)
3. **Distribution channel** for MobileWest brand awareness
4. **Fun side project** with short feedback loops from friends

## Strategic Context

### Background

The developer comes from a strong mobile background and is preparing to launch **MobileWest.com.br** — a mobile release engineering and monitoring company targeting Brazilian startups (similar to Runway + Sentry).

Food Rush provides hands-on experience with:
- Web app deployment and operations
- Payment processing (charges, refunds, subscriptions)
- Error tracking and monitoring
- Real-time multiplayer infrastructure

### Timeline

**Active development:** December 2025 – February 2026 (~2 months)

### Legal Considerations

The developer works for iFood (major food delivery platform in Brazil). Key points:

- Game was shown to managers informally with no friction
- iFood's primary concern is competition — this game is entertainment, not a competing service
- **Action required:** Obtain written approval from employer
- **Fallback:** Theme pivot if approval is denied (same mechanics, different skin)

Potential pivot themes (preserve all gameplay):
- Courier/package delivery
- Pharmacy/medical deliveries
- Fantasy theme (potion runner)
- Retro pizza delivery (80s aesthetic)

---

## Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Learn payment flows | Successfully process charges, refunds, and subscriptions |
| Learn monitoring | Integrate Sentry, log aggregation, uptime monitoring |
| Build portfolio | Game listed on MobileWest as showcase project |
| Maintain engagement | Friends actively playing and providing feedback |
| Brand awareness | MobileWest branding visible in game |

---

## Monetization Strategy

**Primary purpose:** Learn payment infrastructure, not maximize revenue.

### Model: "Turbo Pass" Subscription

| Feature | Details |
|---------|---------|
| Price | R$5-10/month |
| Payment provider | Stripe (best docs, test mode, webhooks) |
| Perks | Exclusive bike skins, leaderboard badge, early feature access |
| Constraint | No gameplay advantage (keep it fair) |

### Additional Revenue Streams (Optional)

| Stream | Purpose |
|--------|---------|
| Cosmetic packs (R$2-5) | Learn one-time purchase flow |
| Tip jar / Ko-fi | Low-friction alternative |

### Learning Objectives

- [ ] Stripe Checkout integration
- [ ] Webhook handling for subscription events
- [ ] Subscription status management
- [ ] Refund processing (manual initially)
- [ ] Failed payment handling

---

## Product Roadmap

### Phase 1 — Foundation (December 2025)

| Task | Priority | Notes |
|------|----------|-------|
| Get written iFood approval | Critical | Blocker for public growth |
| Fix timer sync bug | High | Client uses 5min, server uses 3min |
| Integrate Sentry | High | Error tracking — core MobileWest skill |
| Add analytics (PostHog/Plausible) | Medium | Understand user behavior |
| Add MobileWest branding | Medium | Footer or subtle placement |

### Phase 2 — Payments & Virality (January 2026)

| Task | Priority | Notes |
|------|----------|-------|
| Stripe integration | High | Checkout + webhooks |
| Turbo Pass subscription | High | R$5-10/month |
| Share score button | High | Viral loop mechanism |
| Round-end countdown (10s warning) | Medium | UX polish |
| Subscriber badge on leaderboard | Medium | Visible perk |

### Phase 3 — Polish & Ops Learning (February 2026)

| Task | Priority | Notes |
|------|----------|-------|
| Cosmetic bike skins (2-3) | Medium | Content for purchases |
| Test refund flow | Medium | Process manually, learn the flow |
| Log aggregation (Axiom/LogTail) | Medium | Ops learning |
| Uptime monitoring (UptimeRobot) | Low | Basic availability tracking |
| Document learnings | Low | Prep for MobileWest launch |

---

## Technical Debt & Known Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Timer desync | High | Client: 300s, Server: 180s. Client ignores server value. |
| Collision event spam | Low | No debounce on pickup/delivery events |

---

## Operational Stack (Learning Targets)

| Category | Tool | Purpose |
|----------|------|---------|
| Error tracking | Sentry | Frontend + backend errors |
| Analytics | PostHog or Plausible | User behavior, funnels |
| Payments | Stripe | Subscriptions, charges, refunds |
| Logs | Axiom or LogTail | Centralized log aggregation |
| Uptime | UptimeRobot | Availability monitoring |
| Deployment | PM2 + GitHub webhooks | Auto-deploy on push |

---

## Brand Integration

### MobileWest Visibility

- README attribution: "A MobileWest project"
- In-game footer or credits screen
- Share cards include MobileWest branding
- Portfolio listing on mobilewest.com.br

### Domain Strategy

| Domain | Purpose |
|--------|---------|
| shurato.com.br | Temporary game hosting |
| mobilewest.com.br | Primary company domain |
| Future: dedicated game domain | Optional, if game gains traction |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| iFood legal conflict | Get written approval; have pivot theme ready |
| Low engagement | Keep friends in feedback loop; focus on fun over features |
| Scope creep | Strict 2-month timeline; MVP mindset |
| Payment complexity | Start with Stripe Checkout (hosted); avoid custom flows |

---

## Success Definition

By end of February 2026:

1. Payment infrastructure working (subscriptions, one-time, refunds)
2. Monitoring stack operational (errors, logs, uptime)
3. Game playable and fun for friends
4. MobileWest branding integrated
5. Learnings documented for MobileWest launch

---

*Last updated: December 2025*
