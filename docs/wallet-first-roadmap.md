# Wallet-First Roadmap

Sentinel now treats wallet connection as account creation. Agent registration becomes the main first action, while profile setup is optional and reserved for governance credibility, public identity, and reviewer status.

## Target Journey

1. Connect wallet
2. See instant safety dashboard
3. Register or inspect agents
4. Add optional profile only if governance or social trust features matter

## Days 1-30

Focus on immediate usefulness after wallet connection.

- Auto-create a lightweight account on first wallet connect
- Replace identity-first onboarding with `Connect -> Dashboard`
- Add `My Agents Risk Overview`
- Add Agent Safety Passport pages
- Add pre-flight warnings before risky agent actions
- Keep profile setup visible but secondary

Success targets:

- New user reaches dashboard in under 10 seconds
- Agent owner can register first agent without profile setup
- Users understand risk without opening docs

## Days 31-60

Focus on active fraud prevention.

- Add watchlists and alerts for agents, wallets, and suspicious counterparties
- Add owner guardrails such as transfer caps, daily caps, allowlists, and destination cooldowns
- Add behavior history and trust trends
- Add a review queue for governance-ready users
- Separate anonymous owner trust from governance reputation

Success targets:

- Users configure protection before damage happens
- Reviewers can monitor suspicious agents without manual digging
- Alerting becomes a reason to return

## Days 61-90

Focus on trust network effects.

- Add signed agent manifests
- Add reviewer badges and trust roles
- Add shared fraud intelligence
- Add risk-based insurance recommendations
- Add trust tiers such as `unverified`, `monitored`, `reviewed`, `insured`, and `governance-approved`

Success targets:

- Users choose agents based on visible trust signals
- Good actors earn faster trust
- Suspicious agents are isolated earlier

## Core Feature PRD

### Instant Account Creation

Goal: wallet connection alone is enough to use Sentinel.

Requirements:

- First wallet connect creates account automatically
- No required callsign, faction, or avatar
- Dashboard works for wallet-only users
- Governance actions can require completed profile later

### Agent Safety Passport

Goal: one interpretable place to judge whether an agent is safe.

Include:

- Owner wallet
- Agent age
- Stake or bond
- Permission scope
- Allowed programs
- Transfer limits
- Insurance coverage
- Trust score
- Recent violations
- Governance or case history

### Pre-Flight Risk Warnings

Goal: intervene before unsafe actions execute.

Warn on:

- High transfer amount
- New or unknown destinations
- Unknown programs
- Recent violation history
- Arrest or parole history
- Missing insurance
- Missing manifest or review

### Optional Governance Profile

Goal: make profile setup meaningful instead of mandatory.

Unlocks:

- Governance participation
- Public reviewer identity
- Badge and reputation systems
- Social trust in reports and votes

## Product Rule

Profiles should never gate basic protection features.

Profiles should gate:

- Governance participation
- Public identity
- Reviewer reputation
- Advanced collaboration features

## Recommended Build Order

1. Remove remaining registration dependency from auth flow
2. Build wallet-only dashboard state
3. Add Agent Safety Passport
4. Add pre-flight warnings
5. Add optional governance profile path
