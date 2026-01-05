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

## Running the Medplum Agent Locally

The Medplum Agent is required to receive HL7 messages and other integrations. Follow these steps to run the agent locally:

### 1. Download the Agent

Download the latest Medplum Agent release from the [Medplum releases page](https://github.com/medplum/medplum/releases). Choose the appropriate binary for your platform:

- Linux: `medplum-agent-X.X.X-linux-x64`
- macOS: `medplum-agent-X.X.X-macos-x64`

### 2. Make the Agent Executable

After downloading, you need to give the agent permission to run:

```bash
chmod +x medplum-agent-5.0.10-linux-x64
# Or for macOS:
# chmod +x medplum-agent-5.0.10-macos-x64
```

### 3. Login to Medplum CLI

Before running the agent, authenticate the terminal session with Medplum CLI:

```bash
npx medplum login
```

### 4. Run the Agent

Execute the agent binary:

```bash
./medplum-agent-5.0.10-linux-x64
# Or for macOS:
# ./medplum-agent-5.0.10-macos-x64
```

When the agent successfully connects, you'll see a log message like:

```json
{ "level": "INFO", "msg": "Successfully connected to Medplum server", "timestamp": "2026-01-02T21:25:30.498Z" }
```

### 5. Send Test HL7 Messages

Once the agent is running, you can send test ADT messages using the provided script:

```bash
npm run send-adt A01 201
```

This will send an A01 (patient admission) message for room 201 to the agent.
