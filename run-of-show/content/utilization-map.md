# Utilization Map: Class 1-5 and Class 7

## Intent

This map defines how source deck topics translate into instructor actions inside the Run-of-Show app.

## Training Tracks

- `Class 1-5`: Forklift/industrial truck operations in warehouse and site traffic environments.
- `Class 7`: Telehandler operations with boom geometry, terrain, and lift-planning complexity.
- `Both`: Shared behaviors and standards that apply across all powered industrial truck instruction.

## Utilization Buckets

### Shared Utilization (Both)

- Safety culture language and stop-work authority.
- Regulatory and standards translation to observable behavior.
- Inspection and function testing discipline.
- Communication protocol and blind-zone movement control.
- Documentation, evaluation criteria, and retraining triggers.

### Class 1-5 Utilization

- Aisle, rack, and dock movement controls.
- Indoor pedestrian interface and right-of-way behavior.
- Data plate checks for palletized loads and attachments.
- Battery/LPG condition checks and fueling/charging controls.
- Compact maneuvering and visibility in constrained spaces.

### Class 7 Utilization

- Load chart use with boom angle/extension variables.
- Rough-terrain route planning and surface risk management.
- Spotter protocol for long-reach/limited-visibility tasks.
- Attachment and carriage effects on capacity/stability.
- Pre-lift planning discipline for high-consequence picks.

## Scene Mapping Model

Each scene in `outline.json` now includes:

- `classApplicability`: `class1to5` | `class7` | `both`
- `utilizationItems.shared[]`
- `utilizationItems.class1to5[]`
- `utilizationItems.class7[]`

## Delivery Implications

- Library view should support filtering by class applicability.
- Present view should show class applicability badge for projected context.
- Console view should show split utilization guidance so instructors can pivot delivery by equipment class.

## Source Inputs Used

- `sources/forklift/slide_decks/processed/ANEW-PIT-and-Telehandler-Training-2025.txt`
- `sources/crosswalk/slide_decks/processed/Forklift-Classes-1-5-vs-Telehandler-Class-7-Section-1.txt`
- `sources/crosswalk/slide_decks/processed/Forklift-Classes-1-5-vs-Telehandler-Class-7-Section-2.txt`
- `sources/crosswalk/slide_decks/processed/Forklift-Classes-1-5-vs-Telehandler-Class-7-Section-3.txt`
- `sources/crosswalk/slide_decks/processed/Forklift-Classes-1-5-vs-Telehandler-Class-7-Section-4.txt`
