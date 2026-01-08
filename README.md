# Medplum Transfer Center

This repo is for the Medplum transfer center demo. Currently this portal includes a dashboard for the transfer center, as well as patient intake, and physician onboarding for the portal.

## Repo Overview

TODO: Enumerate bots, scripts and their use cases, important custom components such as the , etc.

## Data Model

### Locations

The [`Location` FHIR resource](https://hl7.org/fhir/r4/location.html) is used to model the hierarchy of locations within the data model. We have three levels of nesting in the current model:

1. Building
2. Level (or ward)
3. Room

Each `Location` has a `type` (eg. building, level, room) and can be "part of" another `Location` resource. We use this `partOf` field to represent that a lower-level location is located within the higher-level location that it is "part of".

For example, the room `ACUTE 212` is "part of" the `ACUTE` level, which is in turn "part of" the hospital building.

This is how that looks hierarchically from the perspective of the FHIR model:

#### Hospital [Location.type=building, Location.partOf is empty]

- **ACUTE [Location.type=level, Location.partOf=Hospital]**
  - ACUTE 212
    - Location.type=room
    - **Location.partOf=ACUTE**
    - Location.alias=212
  - ACUTE 213
    - Location.type=room
    - **Location.partOf=ACUTE**
    - Location.alias=213
  - ...other rooms in ACUTE
- **3SURG [Location.type=level, Location.partOf=Hospital]**
  - 3SURG 307
    - Location.type=room
    - **Location.partOf=3SURG**
    - Location.alias=307
  - 3SURG 308
    - Location.type=room
    - **Location.partOf=3SURG**
    - Location.alias=308
  - ...other rooms in 3SURG
- ...other wards of the hospital

This model allows us to use [FHIR search semantics](https://www.hl7.org/fhir/search.html) to search for rooms which are "part of" the `ACUTE` or `3SURG` ward, or query for all levels that are of "part of" the `Hospital` hospital building.

Note that along with each location, we also denote an "alias" which is just the room number. This allows us to search for just the room number more directly while still displaying the full `Location.name` (eg. `3SURG 307`) by default for the user when facilitating things like user type-aheads in inputs or displaying locations in a table cell.

---

TODO: Include notes about other parts of the data model

## Development

To run the development server for this app, type the following in your console of choice:

```bash
npm run dev
```

This will host the Vite development server locally, which by default should be hosted on port 3000.

## Building for production

To build the app, run:

```bash
npm run build
```

## Upserting core data

To upsert the core data into the Medplum server, run:

```bash
npx medplum post '' "$(cat path/to/bundle.json)"
# Example: npx medplum post '' "$(cat data/core/core-data.json)"
```

### Core data

The core data for the Hospital Regional Portal is stored in the `data/core` directory. This data is used to populate the Medplum server with the necessary resources for the portal to function. The core data includes the following resources:

| Resource Type | Name                                     |
| ------------- | ---------------------------------------- |
| CodeSystem    | call-dispositions                        |
| ValueSet      | accepting-specialties                    |
| ValueSet      | call-dispositions                        |
| ValueSet      | starting-locations                       |
| ValueSet      | time-sensitive-diagnosis                 |
| ValueSet      | transferring-origins                     |
| Questionnaire | accepting-physician-intake-questionnaire |
| Questionnaire | create-location-lvl-questionnaire        |
| Questionnaire | create-location-ro-questionnaire         |
| Questionnaire | patient-bed-assignment-questionnaire     |
| Questionnaire | patient-intake-questionnaire             |
| Questionnaire | physician-onboarding-questionnaire       |

## Bots

The bots in this project are used to automate the creation of resources in the Medplum server.

Before running any of the bot commands, make sure to set the environment variables in the `.env` file.

```bash
cp .env.example .env
```

To build the bots, run:

```bash
npm run bots:build
```

To deploy the bots, run:

```bash
npm run bots:deploy
```

When creating a new bot, make sure to add it to the `BOTS` array in the `scripts/deploy-bots.ts` file.

## Running Commands Locally

### Medplum Agent

The Medplum Agent is required to receive HL7 messages. To run the agent locally, follow the instructions in the [Medplum Agent documentation](https://www.medplum.com/docs/agent).

Once the agent is running, you can send test ADT messages using the provided script to test the sample application:

```bash
npm run send-adt <MESSAGE_TYPE> <ROOM_NUMBER>
```

Available message types:
- `A01` - Patient admission
- `A03` - Patient discharge

Example:

```bash
npm run send-adt A01 201  # Admit patient to room 201
npm run send-adt A03 201  # Discharge patient from room 201
```
