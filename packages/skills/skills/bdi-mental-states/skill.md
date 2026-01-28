# BDI Mental State Modeling

Transform external RDF context into agent mental states (beliefs, desires, intentions) using formal BDI ontology patterns.

## Prerequisites

- Understanding of RDF/Turtle syntax
- Familiarity with ontology concepts

## Instructions

### Mental State Types

**Endurants (Persistent)**:
- `Belief`: What the agent believes to be true
- `Desire`: What the agent wishes to bring about
- `Intention`: What the agent commits to achieving

**Perdurants (Events)**:
- `BeliefProcess`: Forming/updating beliefs from perception
- `DesireProcess`: Generating desires from beliefs
- `IntentionProcess`: Committing to desires as intentions

### Cognitive Chain Pattern

```turtle
:Belief_store_open a bdi:Belief ;
    bdi:motivates :Desire_buy_groceries .

:Desire_buy_groceries a bdi:Desire ;
    bdi:isMotivatedBy :Belief_store_open .

:Intention_go_shopping a bdi:Intention ;
    bdi:fulfils :Desire_buy_groceries ;
    bdi:specifies :Plan_shopping .
```

### T2B2T Paradigm

Triples-to-Beliefs-to-Triples implements bidirectional flow:

1. **Triples-to-Beliefs**: External RDF triggers belief formation
2. **Beliefs-to-Triples**: Mental deliberation produces new RDF output

### Temporal Dimensions

Associate mental states with validity periods:

```turtle
:Belief_B1 a bdi:Belief ;
    bdi:hasValidity :TimeInterval_TI1 .

:TimeInterval_TI1 a bdi:TimeInterval ;
    bdi:hasStartTime :TimeInstant_9am ;
    bdi:hasEndTime :TimeInstant_11am .
```

## Guidelines

1. Model world states as configurations independent of agent perspectives
2. Distinguish endurants (states) from perdurants (processes)
3. Use bidirectional properties (`motivates`/`isMotivatedBy`)
4. Link mental entities to `Justification` instances for explainability
5. Define existential restrictions on mental processes

## Notes

- Enables explainability through traceable reasoning chains
- Supports neuro-symbolic AI integration (Logic Augmented Generation)
- Compatible with SEMAS, JADE, JADEX frameworks

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
