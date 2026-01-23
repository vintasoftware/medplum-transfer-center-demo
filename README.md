<h1 align="center">Medplum Transfer Center</h1>
<p align="center">A demo healthcare transfer center portal built on the Medplum platform.</p>
<p align="center">
  <a href="https://github.com/medplum/medplum-transfer-center-demo/actions">
    <img src="https://github.com/medplum/medplum-transfer-center-demo/actions/workflows/build.yml/badge.svg" />
  </a>
  <a href="https://github.com/medplum/medplum-transfer-center-demo/blob/main/LICENSE.txt">
    <img src="https://img.shields.io/badge/license-Apache-blue.svg" />
  </a>
</p>

### What is Medplum Transfer Center?

Medplum Transfer Center is a **demo transfer center portal** that showcases patient intake, physician onboarding, and a transfer center dashboard. It's built on the open-source [Medplum](https://www.medplum.com) platform and designed for developers to clone, customize, and run.

### Features

- Transfer center dashboard with bed availability tracking
- Patient intake workflows
- Physician onboarding
- HL7 ADT message processing via Medplum Agent
- Location hierarchy management (Building → Level → Room)
- All data represented in [FHIR](https://hl7.org/FHIR/)

Medplum Transfer Center is designed to be forked and customized for your business' needs.

### Getting Started

First, fork and clone the repo.

Next, install the dependencies:

```bash
npm install
```

Then, run the app:

```bash
npm run dev
```

This app should run on `http://localhost:3000/`

### Deploying Your App

#### GitHub Pages

1. In your repository, go to **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Update `vite.config.ts` to set the base path:

```typescript
export default defineConfig({
  base: '/<repository-name>/',
  // ... other config
});
```

Once deployed, your application will be available at:

```
https://<username>.github.io/<repository-name>/
```

For example, if your GitHub username is `acme-health` and repository is `medplum-transfer-center-demo`, the deployed URL will be: `https://acme-health.github.io/medplum-transfer-center-demo/`

### Account Setup

By default, this app points to the hosted Medplum service. To connect to your own Medplum project:

1. [Register a new Project on Medplum](https://www.medplum.com/docs/tutorials/register)
2. Configure your environment variables (see [src/config.ts](src/config.ts))
3. Set up the required core data (see [Data Setup](#data-setup) below)

Contact the Medplum team ([support@medplum.com](mailto:support@medplum.com) or [Discord](https://discord.gg/medplum)) with any questions.

### Data Setup

The core data for the portal is stored in the `data/core` directory. To upsert it into your Medplum server:

```bash
npx medplum post '' "$(cat data/core/core-data.json)"
```

Bots automate resource creation using the Medplum [Bots](https://www.medplum.com/docs/bots) framework. Before deploying bots:

```bash
cp .env.example .env
npm run bots:build
npm run bots:deploy
```

When creating a new bot, add it to the `BOTS` array in `scripts/deploy-bots.ts`.

### Medplum Agent

The Medplum Agent is required to receive HL7 messages. Follow the [Medplum Agent documentation](https://www.medplum.com/docs/agent) to set it up.

**Note:** If you run the agent locally using credentials from a deployed environment, any ADT messages processed will update the live data. For example, if your agent is configured with production environment variables and you send a test ADT message, the room occupancy changes will reflect in the deployed application.

Once the agent is running, send test ADT messages:

```bash
npm run send-adt A01 201  # Admit patient to room 201
npm run send-adt A03 201  # Discharge patient from room 201
```

---

## Technical Reference

The sections below provide detailed technical documentation for developers working with this codebase.

### Bots

Bots are serverless functions that automate resource creation based on `QuestionnaireResponse` submissions. Each bot is triggered via a Medplum Subscription when its associated questionnaire is submitted.

| Bot                              | Description                                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patient-intake-bot`             | Processes patient intake forms, creating `Patient`, `Observation` (vital signs), `AllergyIntolerance`, `ServiceRequest`, `CommunicationRequest`, and `Task` resources |
| `accepting-physician-intake-bot` | Assigns a primary accepting physician to a `ServiceRequest` and associated `Task`                                                                                     |
| `physician-onboarding-bot`       | Creates a new `Practitioner` and `PractitionerRole` for onboarded physicians                                                                                          |
| `location-lvl-bot`               | Creates a new ward/level `Location` resource under the hospital building                                                                                              |
| `location-room-bot`              | Creates a new room `Location` resource under a specified ward                                                                                                         |
| `patient-bed-assignment-bot`     | Assigns a patient to a room, creating an `Encounter`, `Communication`, and updating the room's operational status                                                     |
| `adt-processing-bot`             | Processes HL7 ADT messages (A01, A03, A08) to update room occupancy status based on patient admissions, discharges, and transfers                                     |

### Scripts

| Script                          | Description                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `scripts/deploy-bots.ts`        | Builds and deploys all bots to the Medplum server with their associated subscriptions          |
| `scripts/send-adt-to-agent.cts` | Sends test HL7 ADT messages (A01, A03) to the Medplum Agent for testing room occupancy updates |

### Custom Components

Key UI components for the transfer center dashboard:

| Component                           | Description                                                           |
| ----------------------------------- | --------------------------------------------------------------------- |
| `BedStatsWidget` / `BedStatsGrid`   | Displays bed availability statistics across wards                     |
| `TransferStatusTable`               | Shows transfer requests with status and actions                       |
| `PatientDetails` / `PatientHeader`  | Patient information display with notes and tasks tabs                 |
| `FhirPathTable` / `FhirPathDisplay` | Generic components for rendering FHIR data using FHIRPath expressions |
| `QuestionnaireResponseViewer`       | Displays submitted questionnaire responses                            |

### Core Data Resources

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

### Data Model

#### Locations

The [`Location` FHIR resource](https://hl7.org/fhir/r4/location.html) models the hierarchy of locations with three levels of nesting:

1. Building
2. Level (or ward)
3. Room

Each `Location` has a `type` (eg. building, level, room) and can be "part of" another `Location` resource. This `partOf` field represents that a lower-level location is within the higher-level location.

For example, the room `ACUTE 212` is "part of" the `ACUTE` level, which is in turn "part of" the hospital building:

##### Hospital [Location.type=building, Location.partOf is empty]

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

This model allows [FHIR search semantics](https://www.hl7.org/fhir/search.html) to query rooms "part of" a specific ward, or all levels "part of" the hospital building.

The `alias` field stores just the room number, enabling direct room number searches while displaying the full `Location.name` (eg. `3SURG 307`) in the UI.

#### Transfer Workflow Resources

The transfer workflow uses several interconnected FHIR resources:

**ServiceRequest** - Represents a patient transfer request:

- `subject`: Reference to the `Patient` being transferred
- `requester`: Reference to the transferring `Practitioner`
- `performer`: Reference to the accepting `Practitioner` (assigned later)
- `supportingInfo`: Reference to the intake `QuestionnaireResponse`
- `requisition`: Unique identifier for the transfer request

**Task** - Tracks the workflow status of a transfer request:

- `basedOn`: Reference to the `ServiceRequest`
- `focus`: Reference to the `CommunicationRequest`
- `owner`: Reference to the assigned `Practitioner`
- `status`: Current task status (ready, in-progress, completed)

**CommunicationRequest / Communication** - `CommunicationRequest` captures the need to contact the transferring physician. `Communication` records the outcome:

- `basedOn`: Reference to the `ServiceRequest` or `CommunicationRequest`
- `statusReason`: Call disposition (completed, no answer, voicemail, etc.)

**Encounter** - Created when a patient is assigned to a room:

- `subject`: Reference to the `Patient`
- `location`: Reference to the assigned room `Location`
- `basedOn`: Reference to the `ServiceRequest`
- `status`: Patient's current status (arrived, in-progress, finished)

**Practitioner / PractitionerRole** - `Practitioner` stores physician information. `PractitionerRole` links practitioners to organizations and specialties:

- `practitioner`: Reference to the `Practitioner`
- `organization`: Reference to the `Organization`
- `specialty`: The physician's specialty (used for matching accepting physicians)

---

### Compliance

Medplum backend is HIPAA compliant and SOC 2 certified. Getting an account set up requires registering on [medplum.com](https://www.medplum.com/). Feel free to ask us questions in real time on our [Discord Server](https://discord.gg/medplum).

### About Medplum

[Medplum](https://www.medplum.com/) is an open-source, API-first EHR. Medplum makes it easy to build healthcare apps quickly with less code.

Medplum supports self-hosting and provides a [hosted service](https://app.medplum.com/).

- Read our [documentation](https://www.medplum.com/docs/)
- Browse our [React component library](https://storybook.medplum.com/)
- Join our [Discord](https://discord.gg/medplum)
