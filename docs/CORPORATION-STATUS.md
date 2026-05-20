# Corporation status (living)

One-page executive snapshot. Updated by engineering passes — not a launch guarantee.

**Last pass:** Stripe Connect Express vertical slice (API + dashboard + checkout routing).

## Beta readiness (honest)

| Area | Status |
|------|--------|
| API + wallet ledger | MVP wired |
| Web player + HLS | HLS.js + track queue + preload |
| Artist upload flow | E2E + upload progress bar |
| Discover / release UI | Cover art via API |
| Mobile | Discover → release → expo-av play |
| Federation publish | Wired; Follow stored + **Accept** outbound |
| Library / follows (web) | Wired | `/library`, artist Follow button |
| Prod deploy | **Open** — compose prod overlay added |
| Stripe Connect onboarding | **Wired** (test mode; live KYB open) |
| Mobile / desktop polish | Early |

## P0 still blocking public launch

- Production host + DNS (`docs/DEPLOY-BETA.md`)
- DB migrate on prod
- Stripe E2E with real keys

## Division focus (next)

| Division | Next task |
|----------|-----------|
| OPS-SUP | Deploy beta stack, health probes |
| OPS-SUP | Prod deploy + migrations 0004–0005 |
| UX-SUP | Upload error copy; dashboard a11y table |
| FED-1 | Undo Follow + shared inbox delivery tests |
| NATIVE-SUP | Mobile playback parity |
| ACCESS-0 | Finish web WCAG sweep |

## Agents

Node: `pnpm agents:cycle` (corporation) · `pnpm swarm:cycle` (typed swarm) · Archive: `data/archive/swarm/latest-cycle.md`
