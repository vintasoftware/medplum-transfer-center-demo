import {
  BotEvent,
  MedplumClient,
  UCUM,
  createReference,
  getAllQuestionnaireAnswers,
  getQuestionnaireAnswers,
  resolveId,
} from '@medplum/core';
import {
  Bundle,
  BundleEntry,
  CommunicationRequest,
  Observation,
  Organization,
  Patient,
  Practitioner,
  PractitionerRole,
  QuestionnaireResponse,
  QuestionnaireResponseItemAnswer,
  Reference,
  ServiceRequest,
  Task,
} from '@medplum/fhirtypes';
import {
  createAllergy,
  createBloodPressureObservationComponent,
  createBundleEntry,
  createBundleEntryReference,
  createObservation,
} from '@/utils';
import {
  SAMPLE_MED_REQUISITION_SYSTEM,
  OBSERVATIONS_CODE_MAP,
  PATIENT_INTAKE_QUESTIONNAIRE_NAME,
  VITAL_SIGNS_CATEGORY,
} from '@/constants';

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<Bundle> {
  const { input } = event;

  await validateInput(medplum, input);

  const entries: BundleEntry[] = parseAnswers(input);

  // Execute batch to create all resources at once
  const responseBundle = await medplum.executeBatch({
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  });

  return responseBundle;
}

async function validateInput(medplum: MedplumClient, input: QuestionnaireResponse): Promise<void> {
  if (input.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  if (!input.questionnaire) {
    throw new Error('Missing required Questionnaire');
  }

  const questionnaire = await medplum.readResource(
    'Questionnaire',
    resolveId({ reference: input.questionnaire }) as string
  );
  if (questionnaire.name !== PATIENT_INTAKE_QUESTIONNAIRE_NAME) {
    throw new Error('Invalid questionnaire');
  }
}

/**
 * Parses the answers from the QuestionnaireResponse, creates the appropriate resources, and
 * returns a list of BundleEntry resources to be created.
 */
function parseAnswers(input: QuestionnaireResponse): BundleEntry[] {
  const entries: BundleEntry[] = [];
  const questionnaireReference = createReference(input);
  const answers = getQuestionnaireAnswers(input);

  const requisitionId = answers['requisitionId']?.valueString;
  if (!requisitionId) {
    throw new Error('Missing required requisitionId');
  }

  const dateTime = answers['dateTime']?.valueDateTime;
  if (!dateTime) {
    throw new Error('Missing required Date/Time');
  }
  const effectiveDateTime = new Date(dateTime).toISOString();

  const { patientReference } = createPatient(entries, answers);
  createVitalSigns(entries, answers, questionnaireReference, patientReference, effectiveDateTime);
  createAllergies(entries, input, patientReference);
  createDiagnosis(entries, answers, questionnaireReference, patientReference, effectiveDateTime);
  const { transferPhysician, transferPhysicianReference } = createTransferringPhysician(entries, answers);
  createTransferRequests(
    entries,
    answers,
    questionnaireReference,
    patientReference,
    transferPhysician,
    transferPhysicianReference
  );

  return entries;
}

function createPatient(
  entries: BundleEntry[],
  answers: Record<string, QuestionnaireResponseItemAnswer>
): {
  patientReference: Reference<Patient>;
} {
  const patient: Patient = { resourceType: 'Patient' };

  const firstName = answers['firstName']?.valueString;
  const lastName = answers['lastName']?.valueString;
  if (!firstName || !lastName) {
    throw new Error('Missing required Patient Name');
  }
  patient.name = [{ given: [firstName], family: lastName }];

  const dob = answers['birthdate']?.valueDate;
  if (!dob) {
    throw new Error('Missing required Patient Date of Birth');
  }
  patient.birthDate = dob;

  const phone = answers['phone']?.valueString;
  if (phone) {
    patient.telecom = [{ system: 'phone', value: phone }];
  }

  const street = answers['street']?.valueString;
  const city = answers['city']?.valueString;
  const state = answers['state']?.valueCoding?.code;
  const postalCode = answers['postalCode']?.valueString;
  if (street || city || state || postalCode) {
    patient.address = [
      {
        use: 'home',
        type: 'physical',
        line: street ? [street] : [],
        city: city,
        state: state,
        postalCode: postalCode,
      },
    ];
  }

  const patientEntry = createBundleEntry(patient);
  entries.push(patientEntry);

  const patientReference = createBundleEntryReference(patientEntry) as Reference<Patient>;

  return { patientReference };
}

function createVitalSigns(
  entries: BundleEntry[],
  answers: Record<string, QuestionnaireResponseItemAnswer>,
  questionnaireReference: Reference<QuestionnaireResponse>,
  patientReference: Reference<Patient>,
  effectiveDateTime: string
): void {
  const heartRate = answers['heartRate']?.valueInteger;
  if (heartRate !== undefined && heartRate < 0) {
    throw new Error(`Invalid Heart Rate. Received: ${heartRate}`);
  }
  const heartRateObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.heartRate,
    valueQuantity: {
      value: heartRate,
      unit: 'beats/min',
      system: UCUM,
      code: '/min',
    },
  });
  const heartRateObservationEntry = heartRateObservation ? createBundleEntry(heartRateObservation) : undefined;
  if (heartRateObservationEntry) entries.push(heartRateObservationEntry);

  const bloodPressureDiastolic = answers['bloodPressureDiastolic']?.valueInteger;
  if (bloodPressureDiastolic !== undefined && bloodPressureDiastolic < 0) {
    throw new Error(`Invalid Diastolic Blood Pressure. Received: ${bloodPressureDiastolic}`);
  }
  const bloodPressureSystolic = answers['bloodPressureSystolic']?.valueInteger;
  if (bloodPressureSystolic !== undefined && bloodPressureSystolic < 0) {
    throw new Error(`Invalid Systolic Blood Pressure. Received: ${bloodPressureSystolic}`);
  }
  const bloodPressureObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.bloodPressure,
    component: createBloodPressureObservationComponent({
      diastolic: bloodPressureDiastolic,
      systolic: bloodPressureSystolic,
    }),
  });
  const bloodPressureObservationEntry = bloodPressureObservation
    ? createBundleEntry(bloodPressureObservation)
    : undefined;
  if (bloodPressureObservationEntry) entries.push(bloodPressureObservationEntry);

  const temperature = answers['temperature']?.valueDecimal;
  const temperatureObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.bodyTemperature,
    valueQuantity: {
      value: temperature,
      unit: 'F',
      system: UCUM,
      code: '[degF]',
    },
  });
  const temperatureObservationEntry = temperatureObservation ? createBundleEntry(temperatureObservation) : undefined;
  if (temperatureObservationEntry) entries.push(temperatureObservationEntry);

  const respiratoryRate = answers['respiratoryRate']?.valueDecimal;
  if (respiratoryRate !== undefined && respiratoryRate < 0) {
    throw new Error(`Invalid Respiratory Rate. Received: ${respiratoryRate}`);
  }
  const respiratoryRateObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.respiratoryRate,
    valueQuantity: {
      value: respiratoryRate,
      unit: 'breaths/min',
      system: UCUM,
      code: '/min',
    },
  });
  const respiratoryRateObservationEntry = respiratoryRateObservation
    ? createBundleEntry(respiratoryRateObservation)
    : undefined;
  if (respiratoryRateObservationEntry) entries.push(respiratoryRateObservationEntry);

  const oxygenSaturation = answers['oxygenSaturation']?.valueDecimal;
  const oxygenSaturationObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.oxygenSaturation,
    valueQuantity: {
      value: oxygenSaturation,
      unit: '%O2',
      system: UCUM,
      code: '%',
    },
  });
  const oxygenSaturationObservationEntry = oxygenSaturationObservation
    ? createBundleEntry(oxygenSaturationObservation)
    : undefined;
  if (oxygenSaturationObservationEntry) entries.push(oxygenSaturationObservationEntry);

  const height = answers['height']?.valueDecimal;
  const heightObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.bodyHeight,
    valueQuantity: {
      value: height,
      unit: 'in_i',
      system: UCUM,
      code: '[in_i]',
    },
  });
  const heightObservationEntry = heightObservation ? createBundleEntry(heightObservation) : undefined;
  if (heightObservationEntry) entries.push(heightObservationEntry);

  const weight = answers['weight']?.valueDecimal;
  const weightObservation = createObservation({
    patient: patientReference,
    derivedFrom: [questionnaireReference],
    effectiveDateTime,
    category: VITAL_SIGNS_CATEGORY,
    code: OBSERVATIONS_CODE_MAP.bodyWeight,
    valueQuantity: {
      value: weight,
      unit: 'kg',
      system: UCUM,
      code: 'kg',
    },
  });
  const weightObservationEntry = weightObservation ? createBundleEntry(weightObservation) : undefined;
  if (weightObservationEntry) entries.push(weightObservationEntry);

  // Create a panel observation for all vital signs if comments or other observations are present
  const vitalSignsComments = answers['vitalSignsComments']?.valueString;
  const vitalSignsHasMember = [
    heartRateObservationEntry,
    bloodPressureObservationEntry,
    temperatureObservationEntry,
    respiratoryRateObservationEntry,
    oxygenSaturationObservationEntry,
    heightObservationEntry,
    weightObservationEntry,
  ]
    .filter((observationEntry) => observationEntry !== undefined)
    .map((observationEntry) => createBundleEntryReference(observationEntry));

  if (vitalSignsComments || vitalSignsHasMember) {
    const vitalSignsPanelObservation = createObservation({
      patient: patientReference,
      derivedFrom: [questionnaireReference],
      effectiveDateTime,
      code: OBSERVATIONS_CODE_MAP.vitalSignsPanel,
      hasMember: vitalSignsHasMember as Reference<Observation>[],
      note: vitalSignsComments,
    });
    if (vitalSignsPanelObservation) entries.push(createBundleEntry(vitalSignsPanelObservation));
  }
}

function createAllergies(
  entries: BundleEntry[],
  input: QuestionnaireResponse,
  patientReference: Reference<Patient>
): void {
  const allergyAnswers = getAllQuestionnaireAnswers(input)['allergySubstance'] || [];
  allergyAnswers.forEach((allergyAnswer) => {
    const allergy = createAllergy({ allergy: allergyAnswer.valueCoding, patient: patientReference });
    if (allergy) {
      entries.push(createBundleEntry(allergy));
    }
  });
}

function createDiagnosis(
  entries: BundleEntry[],
  answers: Record<string, QuestionnaireResponseItemAnswer>,
  questionnaireReference: Reference<QuestionnaireResponse>,
  patientReference: Reference<Patient>,
  effectiveDateTime: string
): void {
  const timeSensitiveDiagnosis = answers['timeSensitiveDiagnosis']?.valueCoding;
  if (timeSensitiveDiagnosis) {
    const diagnosisObservation = createObservation({
      patient: patientReference,
      derivedFrom: [questionnaireReference],
      effectiveDateTime,
      code: OBSERVATIONS_CODE_MAP.timeSensitiveDiagnosis,
      valueCodeableConcept: { coding: [timeSensitiveDiagnosis] },
    });
    if (diagnosisObservation) {
      entries.push(createBundleEntry(diagnosisObservation));
    }
  }

  const chiefComplaint = answers['chiefComplaint']?.valueCoding;
  const chiefComplaintComments = answers['chiefComplaintComments']?.valueString;
  if (chiefComplaint || chiefComplaintComments) {
    const chiefComplaintObservation = createObservation({
      patient: patientReference,
      derivedFrom: [questionnaireReference],
      effectiveDateTime,
      code: OBSERVATIONS_CODE_MAP.chiefComplaint,
      valueCodeableConcept: chiefComplaint ? { coding: [chiefComplaint] } : undefined,
      note: chiefComplaintComments,
    });
    if (chiefComplaintObservation) {
      entries.push(createBundleEntry(chiefComplaintObservation));
    }
  }
}

function createTransferringPhysician(
  entries: BundleEntry[],
  answers: Record<string, QuestionnaireResponseItemAnswer>
): {
  transferPhysician: Practitioner;
  transferPhysicianReference: Reference<Practitioner>;
} {
  const transferFacility = answers['transferFacility']?.valueReference;
  if (!transferFacility?.reference?.startsWith('Organization')) {
    throw new Error('Transferring facility is not a valid reference to an Organization');
  }

  const transferPhysician: Practitioner = { resourceType: 'Practitioner' };
  const transferPhysicianFirstName = answers['transferPhysFirst']?.valueString;
  const transferPhysicianLastName = answers['transferPhysLast']?.valueString;
  if (!transferPhysicianFirstName || !transferPhysicianLastName) {
    throw new Error('Missing required Transferring Physician Name');
  }
  transferPhysician.name = [{ given: [transferPhysicianFirstName], family: transferPhysicianLastName }];

  const transferPhysicianQualifications = answers['transferPhysQual']?.valueString;
  if (transferPhysicianQualifications) {
    transferPhysician.name[0].suffix = transferPhysicianQualifications.split(' ');
  }

  const transferPhysicianPhone = answers['transferPhysPhone']?.valueString;
  if (!transferPhysicianPhone) {
    throw new Error('Missing required Transferring Physician Phone');
  }
  transferPhysician.telecom = [{ system: 'phone', value: transferPhysicianPhone }];

  const transferPhysicianEntry = createBundleEntry(transferPhysician);
  const transferPhysicianReference = createBundleEntryReference(transferPhysicianEntry) as Reference<Practitioner>;
  entries.push(transferPhysicianEntry);

  const transferPhysicianPractitionerRole: PractitionerRole = {
    resourceType: 'PractitionerRole',
    practitioner: transferPhysicianReference,
    organization: transferFacility as Reference<Organization>,
  };
  entries.push(createBundleEntry(transferPhysicianPractitionerRole));

  return { transferPhysician, transferPhysicianReference };
}

function createTransferRequests(
  entries: BundleEntry[],
  answers: Record<string, QuestionnaireResponseItemAnswer>,
  questionnaireReference: Reference<QuestionnaireResponse>,
  patientReference: Reference<Patient>,
  transferPhysician: Practitioner,
  transferPhysicianReference: Reference<Practitioner>
) {
  const serviceRequest: ServiceRequest = {
    resourceType: 'ServiceRequest',
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '19712007', display: 'Patient transfer (procedure)' }],
      text: 'Patient transfer',
    },
    status: 'active',
    intent: 'proposal',
    subject: patientReference,
    requester: transferPhysicianReference,
    supportingInfo: [{ ...questionnaireReference, display: 'Patient Intake Form' }],
    requisition: { system: SAMPLE_MED_REQUISITION_SYSTEM, value: answers['requisitionId']?.valueString },
    authoredOn: new Date().toISOString(),
  };
  const serviceRequestEntry = createBundleEntry(serviceRequest);
  const serviceRequestReference = createBundleEntryReference(serviceRequestEntry) as Reference<ServiceRequest>;
  entries.push(serviceRequestEntry);

  const communicationRequest: CommunicationRequest = {
    resourceType: 'CommunicationRequest',
    status: 'active',
    payload: [{ contentString: transferPhysician.telecom?.find((val) => val.system === 'phone')?.value as string }],
    basedOn: [serviceRequestReference],
  };
  const communicationRequestEntry = createBundleEntry(communicationRequest);
  const communicationRequestReference = createBundleEntryReference(
    communicationRequestEntry
  ) as Reference<CommunicationRequest>;
  entries.push(communicationRequestEntry);

  const callTask: Task = {
    resourceType: 'Task',
    status: 'ready',
    priority: 'asap',
    intent: 'plan',
    code: { coding: [{ system: 'http://hl7.org/fhir/CodeSystem/task-code', code: 'fulfill' }] },
    input: [
      {
        type: { coding: [{ code: 'comm_req', display: 'Communication request' }] },
        valueReference: communicationRequestReference,
      },
      {
        type: { coding: [{ code: 'subject_patient', display: 'Patient' }] },
        valueReference: patientReference,
      },
    ],
    basedOn: [serviceRequestReference],
    focus: communicationRequestReference,
  };
  entries.push(createBundleEntry(callTask));
}
