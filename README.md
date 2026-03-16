<h1 align="center">Medplum Transfer Center</h1>
<p align="center">An open-source hospital transfer center portal built on the Medplum platform.</p>
<p align="center">
  <a href="https://github.com/medplum/medplum-transfer-center-demo/actions">
    <img src="https://github.com/medplum/medplum-transfer-center-demo/actions/workflows/build.yml/badge.svg" />
  </a>
  <a href="https://github.com/medplum/medplum-transfer-center-demo/blob/main/LICENSE.txt">
    <img src="https://img.shields.io/badge/license-Apache-blue.svg" />
  </a>
</p>

### What is the Medplum Transfer Center?

The Medplum Transfer Center is a **ready-to-use hospital transfer center demo app** that is open source. It provides a portal for managing patient transfers between facilities, including a transfer center dashboard, patient intake, and physician onboarding. It is meant for developers to clone, customize, and run.

### Features

- Completely free and open-source
- Secure and compliant [Medplum](https://www.medplum.com) backend, which is also open source
- Transfer center dashboard for managing incoming patient transfers
- Patient intake workflow via FHIR Questionnaires
- Physician onboarding for accepting transfer requests
- Hospital location management (buildings, wards, rooms)
- Real-time HL7 ADT message processing via Medplum Agent
- Automated bed assignment workflows
- All data represented in [FHIR](https://hl7.org/FHIR/)

## Repo Overview

| Directory / File            | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `src/`                      | React application source code (pages, components, hooks, utils)    |
| `src/bots/`                 | Medplum bots for automating FHIR resource creation and HL7 parsing |
| `data/core/`                | Core FHIR bundle data (CodeSystems, ValueSets, Questionnaires)     |
| `scripts/`                  | Utility scripts for deploying bots and sending ADT messages        |
| `data/core/agent-data.json` | Medplum Agent and Endpoint resource definitions                    |

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

## Getting Started

First, [fork](https://github.com/medplum/medplum-transfer-center-demo/fork) and clone the repo.

Next, install the app from your terminal:

```bash
npm install
```

### Environment Setup

Copy the example environment file and fill in your Medplum project credentials:

```bash
cp .env.example .env
```

| Variable                        | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `VITE_MEDPLUM_PROJECT_ID`       | Your Medplum project ID (used by the frontend)     |
| `VITE_MEDPLUM_GOOGLE_CLIENT_ID` | Google OAuth client ID for login (optional)        |
| `MEDPLUM_CLIENT_ID`             | Medplum client ID for bot deployment scripts       |
| `MEDPLUM_CLIENT_SECRET`         | Medplum client secret for bot deployment scripts   |
| `DEPLOY_MEDPLUM_CLIENT_ID`      | Medplum client ID used during CI/CD deployment     |
| `DEPLOY_MEDPLUM_CLIENT_SECRET`  | Medplum client secret used during CI/CD deployment |

Then, run the app:

```bash
npm run dev
```

This app should run on `http://localhost:3000/`

## Building for Production

To build the app, run:

```bash
npm run build
```

## Upserting Core Data

To upsert the core data into the Medplum server, run:

```bash
npx medplum post '' "$(cat path/to/bundle.json)"
# Example: npx medplum post '' "$(cat data/core/core-data.json)"
```

### Core Data

The core data for the Transfer Center is stored in the `data/core` directory. This data is used to populate the Medplum server with the necessary resources for the portal to function. The core data includes the following resources:

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

## Questionnaires

[FHIR Questionnaires](https://hl7.org/fhir/r4/questionnaire.html) are structured forms defined as FHIR resources. They describe the fields, types, and validation rules for a form, while a `QuestionnaireResponse` stores the answers a user submitted. This separation keeps the form definition (the schema) independent from the collected data (the responses).

In this portal, Questionnaires drive every user-facing workflow. The frontend renders them using Medplum's `<QuestionnaireForm>` React component, and each submission produces a `QuestionnaireResponse` that triggers the corresponding bot via a FHIR Subscription (see [Bots](#bots) below).

| Questionnaire name                         | Title                     | Purpose                                            |
| ------------------------------------------ | ------------------------- | -------------------------------------------------- |
| `patient-intake-questionnaire`             | Patient Transfer Form     | Captures incoming transfer request details         |
| `accepting-physician-intake-questionnaire` | Accepting Physician Form  | Records the accepting physician's intake decision  |
| `patient-bed-assignment-questionnaire`     | Patient Bed Assignment    | Assigns an admitted patient to a specific bed/room |
| `physician-onboarding-questionnaire`       | Physician Onboarding Form | Onboards a new physician into the portal           |
| `create-location-lvl-questionnaire`        | Create Location Form      | Creates a new ward/level Location resource         |
| `create-location-ro-questionnaire`         | Create Room Form          | Creates a new room Location resource               |

All Questionnaire definitions are bundled in [data/core/core-data.json](data/core/core-data.json) and uploaded to Medplum as part of the core data setup.

## Bots

Bots are server-side TypeScript functions that run on the Medplum platform in response to events. This project uses two triggering mechanisms:

- **FHIR Subscriptions** — six bots are subscribed to the `create` event of a specific `QuestionnaireResponse`. When a user submits a form (Questionnaire) in the portal, Medplum fires the subscription and invokes the corresponding bot.
- **Medplum Agent** — the ADT processing bot has no subscription. Instead, it is invoked directly by the Medplum Agent whenever an HL7 v2 ADT message arrives over MLLP.

The deploy script in [scripts/deploy-bots.ts](scripts/deploy-bots.ts) handles creating or updating each bot and its associated `Subscription` resource automatically when you run `npm run bots:deploy`.

### Bot Reference

| Bot                                                                             | Trigger                           | Questionnaire                              |
| ------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| [patient-intake-bot.ts](src/bots/patient-intake-bot.ts)                         | `QuestionnaireResponse` created   | `patient-intake-questionnaire`             |
| [accepting-physician-intake-bot.ts](src/bots/accepting-physician-intake-bot.ts) | `QuestionnaireResponse` created   | `accepting-physician-intake-questionnaire` |
| [patient-bed-assignment-bot.ts](src/bots/patient-bed-assignment-bot.ts)         | `QuestionnaireResponse` created   | `patient-bed-assignment-questionnaire`     |
| [physician-onboarding-bot.ts](src/bots/physician-onboarding-bot.ts)             | `QuestionnaireResponse` created   | `physician-onboarding-questionnaire`       |
| [location-lvl-bot.ts](src/bots/location-lvl-bot.ts)                             | `QuestionnaireResponse` created   | `create-location-lvl-questionnaire`        |
| [location-room-bot.ts](src/bots/location-room-bot.ts)                           | `QuestionnaireResponse` created   | `create-location-ro-questionnaire`         |
| [adt-processing-bot.cts](src/bots/adt-processing-bot.cts)                       | Medplum Agent (HL7 ADT over MLLP) | —                                          |

### Building and Deploying

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

### Creating the Agent and Endpoint

After deploying the bots, you need to create the Medplum Agent and Endpoint resources to enable HL7 message processing:

1. First, update the `data/core/agent-data.json` file with your ADT processing bot ID. Replace `${YOUR_ADT_PROCESSING_BOT_ID}` with the actual Bot ID from your deployed bots.

2. Then, upload the agent configuration:

```bash
npx medplum post '' "$(cat data/core/agent-data.json)"
```

This will create:

- An **Endpoint** resource configured for HL7 v2 MLLP on port 56000
- An **Agent** resource that routes incoming HL7 messages to your ADT processing bot

## Running Commands Locally

### Medplum Agent

The Medplum Agent is required to receive HL7 messages. To run the agent locally, follow the instructions in the [Medplum Agent documentation](https://www.medplum.com/docs/agent).

Once the agent is running, you can send ADT messages using the provided script to test the sample application:

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

## Account Setup

By default, your locally running Transfer Center app points to the hosted Medplum service. To use your own organization's Medplum project, [register a new Project on Medplum](https://www.medplum.com/docs/tutorials/register) and configure your environment variables accordingly (see [config.ts](src/config.ts)).

If you are using the Medplum Hosted service, you can log in to your Medplum instance and add the following identifiers to your [Project Site Settings](https://app.medplum.com/admin/sites):

- Google Client Id
- Google Client Secret
- Recaptcha Site Key
- Recaptcha Secret Key

Contact the Medplum team ([support@medplum.com](mailto:support@medplum.com) or [Discord](https://discord.gg/medplum)) with any questions.

## About Medplum

[Medplum](https://www.medplum.com/) is an open-source, API-first EHR. Medplum makes it easy to build healthcare apps quickly with less code.

Medplum supports self-hosting and provides a [hosted service](https://app.medplum.com/).

- Read our [documentation](https://www.medplum.com/docs/)
- Browse our [React component library](https://storybook.medplum.com/)
- Join our [Discord](https://discord.gg/medplum)
