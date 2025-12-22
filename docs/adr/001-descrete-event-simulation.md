<!-- docs/adr/001-discrete-event-simulation.md -->

# ADR 001 — Discrete-Event Simulation Engine

Date: 2025-12-23  
Status: Accepted

## Context
We need to simulate a game economy represented as a directed graph (Machinations-like).
We want:
- deterministic runs (seeded)
- support for delays, batches, probabilistic routing
- ability to step through events for debugging and visualization (token movement)

We must keep simulation logic UI-agnostic and plugin-extensible.

## Decision
Implement the simulation engine as a **discrete-event simulation** with an **event queue**:
- Nodes and edges schedule events (arrivals/transfers).
- Engine processes events in time order.
- Delays are represented by future scheduled events.
- Random routing uses seeded RNG.

## Alternatives Considered
1) Fixed timestep (tick-based) simulation
- Pros: simpler mental model, easy to animate in lockstep
- Cons: harder to model sparse events efficiently; awkward for exact delays and “next-event” stepping.

2) Hybrid tick + events
- Pros: can combine continuous-ish rates with events
- Cons: more complexity early; unclear benefit for MVP.

## Consequences
- Stepping and debugging is straightforward (process next event).
- Delays and queues are natural.
- UI animation can interpolate token motion between events using timestamps/progress.
- If later we need continuous rates, we can model them as scheduled recurring events (or add hybrid features with a new ADR).
