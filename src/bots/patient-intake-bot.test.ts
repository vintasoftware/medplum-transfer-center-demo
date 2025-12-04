import { createReference, generateId, getReferenceString, ICD10, LOINC, SNOMED, UCUM } from '@medplum/core';
import {
  Patient,
  Practitioner,
  PractitionerRole,
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { PATIENT_INTAKE_QUESTIONNAIRE_NAME } from '@/constants';
import { handler } from './patient-intake-bot';

describe('Patient Intake Bot', async () => {
  let medplum: MockClient;
  let questionnaire: Questionnaire;
  const bot = { reference: 'Bot/123' };
  const contentType = 'application/fhir+json';
  const requiredAnswerItems = [
    {
      linkId: 'dateTime',
      answer: [{ valueDateTime: '2024-10-23T14:30:00Z' }],
    },
    {
      linkId: 'patientInfo',
      item: [
        {
          linkId: 'firstName',
          answer: [{ valueString: 'Marge' }],
        },
        {
          linkId: 'lastName',
          answer: [{ valueString: 'Simpson' }],
        },
        {
          linkId: 'birthdate',
          answer: [{ valueDate: '1958-03-19' }],
        },
      ],
    },
    {
      linkId: 'transferInfo',
      item: [
        {
          linkId: 'transferFacility',
          answer: [
            {
              valueReference: {
                reference: 'Organization/222',
                display: 'Acme Hospital',
              },
            },
          ],
        },
        {
          linkId: 'transferPhys',
          item: [
            {
              linkId: 'transferPhysFirst',
              answer: [{ valueString: 'Marie' }],
            },
            {
              linkId: 'transferPhysLast',
              answer: [{ valueString: 'Anne' }],
            },
            {
              linkId: 'transferPhysPhone',
              answer: [{ valueString: '111-222-4444' }],
            },
          ],
        },
      ],
    },
    {
      linkId: 'requisitionId',
      answer: [{ valueString: generateId() }],
    },
  ];

  beforeEach(async () => {
    medplum = new MockClient();
    questionnaire = await medplum.createResource({
      resourceType: 'Questionnaire',
      status: 'active',
      title: 'Patient Transfer Form',
      name: PATIENT_INTAKE_QUESTIONNAIRE_NAME,
    });
  });

  function createInput(items: QuestionnaireResponseItem[] = []): QuestionnaireResponse {
    return {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: getReferenceString(questionnaire),
      item: [...requiredAnswerItems, ...items],
    };
  }

  function removeItemsRecursively(items: QuestionnaireResponseItem[], linkIds: string[]): QuestionnaireResponseItem[] {
    return items.reduce((filteredItems, { linkId, item, ...rest }) => {
      if (!linkIds.includes(linkId)) {
        filteredItems.push({
          ...rest,
          linkId,
          item: item ? removeItemsRecursively(item, linkIds) : undefined,
        });
      }
      return filteredItems;
    }, [] as QuestionnaireResponseItem[]);
  }

  describe('Validate Input', async () => {
    it('throws error on missing questionnaire', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Questionnaire');
    });

    it('throws error on invalid questionnaire', async () => {
      const otherQuestionnaire = await medplum.createResource({
        resourceType: 'Questionnaire',
        title: 'Other Questionnaire',
        status: 'active',
      });
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(otherQuestionnaire),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Invalid questionnaire');
    });
  });

  describe('Patient', async () => {
    it('successfully creates the Patient resource', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'phone',
          answer: [{ valueString: '123-456-7890' }],
        },
        {
          linkId: 'street',
          answer: [{ valueString: '123 Main St' }],
        },
        {
          linkId: 'city',
          answer: [{ valueString: 'Sunnyvale' }],
        },
        {
          linkId: 'state',
          answer: [{ valueCoding: { system: 'http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state', code: 'CA' } }],
        },
        {
          linkId: 'postalCode',
          answer: [{ valueString: '95008' }],
        },
      ]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();
      expect(patient).toMatchObject({
        name: [{ family: 'Simpson', given: ['Marge'] }],
        birthDate: '1958-03-19',
        telecom: [{ system: 'phone', value: '123-456-7890' }],
        address: [
          {
            use: 'home',
            type: 'physical',
            line: ['123 Main St'],
            city: 'Sunnyvale',
            state: 'CA',
            postalCode: '95008',
          },
        ],
      });
    });

    it('throws error on missing requisitionId', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['requisitionId']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required requisitionId');
    });

    it('throws error on missing dateTime', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['dateTime']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Date/Time');
    });

    it('throws error on missing patient name', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['firstName', 'lastName']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Patient Name');
    });

    it('throws error on missing patient dob', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['birthdate']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Patient Date of Birth');
    });
  });

  describe('Vital Signs', async () => {
    it('successfully creates Vital Signs resources', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'vitalSigns',
          item: [
            {
              linkId: 'bloodPressureSystolic',
              answer: [{ valueInteger: 120 }],
            },
            {
              linkId: 'bloodPressureDiastolic',
              answer: [{ valueInteger: 80 }],
            },
            {
              linkId: 'temperature',
              answer: [{ valueDecimal: 98.6 }],
            },
            {
              linkId: 'heartRate',
              answer: [{ valueInteger: 72 }],
            },
            {
              linkId: 'respiratoryRate',
              answer: [{ valueDecimal: 12 }],
            },
            {
              linkId: 'oxygenSaturation',
              answer: [{ valueDecimal: 98 }],
            },
            {
              linkId: 'height',
              answer: [{ valueDecimal: 65 }],
            },
            {
              linkId: 'weight',
              answer: [{ valueDecimal: 133 }],
            },
            {
              linkId: 'vitalSignsComments',
              answer: [{ valueString: 'Pay attention to the heart rate' }],
            },
          ],
        },
      ]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      // Patient
      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      // Vital Signs
      const bloodPressureObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|85354-9`,
      });
      expect(bloodPressureObservation).toHaveLength(1);
      expect(bloodPressureObservation[0].component).toHaveLength(2);
      expect(bloodPressureObservation[0].component?.[0].code.coding?.[0].code).toEqual('8462-4');
      expect(bloodPressureObservation[0].component?.[0].valueQuantity).toEqual({
        value: 80,
        unit: 'mmHg',
        system: UCUM,
        code: 'mm[Hg]',
      });
      expect(bloodPressureObservation[0].component?.[1].code.coding?.[0].code).toEqual('8480-6');
      expect(bloodPressureObservation[0].component?.[1].valueQuantity).toEqual({
        value: 120,
        unit: 'mmHg',
        system: UCUM,
        code: 'mm[Hg]',
      });

      const temperatureObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|8310-5`,
      });
      expect(temperatureObservation).toHaveLength(1);
      expect(temperatureObservation[0].valueQuantity).toEqual({
        value: 98.6,
        unit: 'F',
        system: UCUM,
        code: '[degF]',
      });

      const heartRateObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|8867-4`,
      });
      expect(heartRateObservation).toHaveLength(1);
      expect(heartRateObservation[0].valueQuantity).toEqual({
        value: 72,
        unit: 'beats/min',
        system: UCUM,
        code: '/min',
      });

      const respiratoryRateObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|9279-1`,
      });
      expect(respiratoryRateObservation).toHaveLength(1);
      expect(respiratoryRateObservation[0].valueQuantity).toEqual({
        value: 12,
        unit: 'breaths/min',
        system: UCUM,
        code: '/min',
      });

      const oxygenSaturationObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|59408-5`,
      });
      expect(oxygenSaturationObservation).toHaveLength(1);
      expect(oxygenSaturationObservation[0].valueQuantity).toEqual({
        value: 98,
        unit: '%O2',
        system: UCUM,
        code: '%',
      });

      const heightObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|8302-2`,
      });
      expect(heightObservation).toHaveLength(1);
      expect(heightObservation[0].valueQuantity).toEqual({
        value: 65,
        unit: 'in_i',
        system: UCUM,
        code: '[in_i]',
      });

      const weightObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|29463-7`,
      });
      expect(weightObservation).toHaveLength(1);
      expect(weightObservation[0].valueQuantity).toEqual({
        value: 133,
        unit: 'kg',
        system: UCUM,
        code: 'kg',
      });

      const vitalSignsPanelObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|85353-1`,
      });
      expect(vitalSignsPanelObservation).toHaveLength(1);
      expect(vitalSignsPanelObservation[0].note?.[0].text).toEqual('Pay attention to the heart rate');
      expect(vitalSignsPanelObservation[0].hasMember).toHaveLength(7);
      expect(vitalSignsPanelObservation[0].hasMember).toEqual(
        expect.arrayContaining([
          createReference(bloodPressureObservation[0]),
          createReference(temperatureObservation[0]),
          createReference(heartRateObservation[0]),
          createReference(respiratoryRateObservation[0]),
          createReference(oxygenSaturationObservation[0]),
          createReference(heightObservation[0]),
          createReference(weightObservation[0]),
        ])
      );
    });

    it('does not create vital signs panel if no vital signs are present', async () => {
      const input: QuestionnaireResponse = createInput([]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      const vitalSignsPanelObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|85353-1`,
      });
      expect(vitalSignsPanelObservation).toHaveLength(0);
    });

    it('throws error on negative heart rate', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'vitalSigns',
          item: [
            {
              linkId: 'heartRate',
              answer: [{ valueInteger: -10 }],
            },
          ],
        },
      ]);

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Invalid Heart Rate. Received: -10');
    });

    it('throws error on negative diastolic blood pressure', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'vitalSigns',
          item: [
            {
              linkId: 'bloodPressureDiastolic',
              answer: [{ valueInteger: -80 }],
            },
          ],
        },
      ]);

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Invalid Diastolic Blood Pressure. Received: -80');
    });

    it('throws error on negative systolic blood pressure', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'vitalSigns',
          item: [
            {
              linkId: 'bloodPressureSystolic',
              answer: [{ valueInteger: -120 }],
            },
          ],
        },
      ]);

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Invalid Systolic Blood Pressure. Received: -120');
    });

    it('throws error on negative respiratory rate', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'vitalSigns',
          item: [
            {
              linkId: 'respiratoryRate',
              answer: [{ valueDecimal: -12 }],
            },
          ],
        },
      ]);

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Invalid Respiratory Rate. Received: -12');
    });
  });

  describe('Allergies', async () => {
    it('successfully creates allergy resources', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'allergies',
          item: [
            {
              linkId: 'allergySubstance',
              answer: [
                {
                  valueCoding: {
                    system: SNOMED,
                    code: '111088007',
                    display: 'Latex (substance)',
                  },
                },
              ],
            },
          ],
        },
        {
          linkId: 'allergies',
          item: [
            {
              linkId: 'allergySubstance',
              answer: [
                {
                  valueCoding: {
                    system: SNOMED,
                    code: '256259004',
                    display: 'Pollen (substance)',
                  },
                },
              ],
            },
          ],
        },
      ]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      // Patient
      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      // Allergies
      const allergies = await medplum.searchResources('AllergyIntolerance', {
        patient: getReferenceString(patient),
      });
      expect(allergies).toHaveLength(2);
      expect(allergies[0].code?.coding).toEqual([
        {
          system: SNOMED,
          code: '111088007',
          display: 'Latex (substance)',
        },
      ]);
      expect(allergies[1].code?.coding).toEqual([
        {
          system: SNOMED,
          code: '256259004',
          display: 'Pollen (substance)',
        },
      ]);
    });
  });

  describe('Diagnosis', async () => {
    it('successfully creates diagnosis resources', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'transferInfo',
          item: [
            {
              linkId: 'timeSensitiveDiagnosis',
              answer: [
                {
                  valueCoding: {
                    system: SNOMED,
                    code: '401303003',
                    display: 'STEMI',
                  },
                },
              ],
            },
            {
              linkId: 'chiefComplaint',
              answer: [
                {
                  valueCoding: {
                    system: ICD10,
                    code: 'I50',
                    display: 'Heart failure',
                  },
                },
              ],
            },
            {
              linkId: 'chiefComplaintComments',
              answer: [{ valueString: 'Shortness of breath' }],
            },
          ],
        },
      ]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      // Patient
      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      // Diagnosis
      const timeSensitiveDiagnosisObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|78026-2`,
      });
      expect(timeSensitiveDiagnosisObservation).toHaveLength(1);
      expect(timeSensitiveDiagnosisObservation[0].valueCodeableConcept).toEqual({
        coding: [
          {
            system: SNOMED,
            code: '401303003',
            display: 'STEMI',
          },
        ],
      });

      const chiefComplaintObservation = await medplum.searchResources('Observation', {
        subject: getReferenceString(patient),
        code: `${LOINC}|46239-0`,
      });
      expect(chiefComplaintObservation).toHaveLength(1);
      expect(chiefComplaintObservation[0].valueCodeableConcept).toEqual({
        coding: [
          {
            system: ICD10,
            code: 'I50',
            display: 'Heart failure',
          },
        ],
      });
      expect(chiefComplaintObservation[0].note?.[0].text).toEqual('Shortness of breath');
    });
  });

  describe('Transfer Info', async () => {
    it('successfully creates transferring physician resources', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'transferInfo',
          item: [
            {
              linkId: 'transferFacility',
              answer: [
                {
                  valueReference: {
                    reference: 'Organization/222',
                    display: 'Acme Hospital',
                  },
                },
              ],
            },
            {
              linkId: 'transferPhys',
              item: [
                {
                  linkId: 'transferPhysFirst',
                  answer: [{ valueString: 'Marie' }],
                },
                {
                  linkId: 'transferPhysLast',
                  answer: [{ valueString: 'Anne' }],
                },
                {
                  linkId: 'transferPhysQual',
                  answer: [{ valueString: 'MD' }],
                },
                {
                  linkId: 'transferPhysPhone',
                  answer: [{ valueString: '111-222-4444' }],
                },
              ],
            },
          ],
        },
      ]);

      await handler(medplum, { bot, input, contentType, secrets: {} });

      // Patient
      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      // Transferring Physician
      const transferPhysician = (await medplum.searchOne('Practitioner', 'name=Marie')) as Practitioner;
      expect(transferPhysician).toBeDefined();
      expect(transferPhysician).toMatchObject({
        name: [{ family: 'Anne', given: ['Marie'], suffix: ['MD'] }],
        telecom: [{ system: 'phone', value: '111-222-4444' }],
      });

      const transferPhysicianPractitionerRole = (await medplum.searchOne('PractitionerRole', {
        practitioner: getReferenceString(transferPhysician),
      })) as PractitionerRole;
      expect(transferPhysicianPractitionerRole).toBeDefined();
      expect(transferPhysicianPractitionerRole.organization).toEqual({
        reference: 'Organization/222',
        display: 'Acme Hospital',
      });
    });

    it('successfully creates transfer request resources', async () => {
      const input: QuestionnaireResponse = createInput();

      const requisitionId = input.item?.find((item) => item.linkId === 'requisitionId')?.answer?.[0].valueString;

      await handler(medplum, { bot, input, contentType, secrets: {} });

      // Patient
      const patient = (await medplum.searchOne('Patient', 'name=Marge')) as Patient;
      expect(patient).toBeDefined();

      // Transferring Physician
      const transferPhysician = (await medplum.searchOne('Practitioner', 'name=Marie')) as Practitioner;
      expect(transferPhysician).toBeDefined();

      // ServiceRequest
      const serviceRequest = await medplum.searchResources('ServiceRequest', {
        subject: getReferenceString(patient),
      });
      expect(serviceRequest).toHaveLength(1);
      expect(serviceRequest[0]).toMatchObject({
        status: 'active',
        intent: 'proposal',
        code: {
          coding: [{ system: SNOMED, code: '19712007', display: 'Patient transfer (procedure)' }],
          text: 'Patient transfer',
        },
        requester: createReference(transferPhysician),
        supportingInfo: [{ ...createReference(input), display: 'Patient Intake Form' }],
        requisition: {
          system: 'https://samplemed.com/fhir/requisition-id',
          value: requisitionId,
        },
        authoredOn: expect.any(String),
      });

      // CommunicationRequest
      const communicationRequest = await medplum.searchResources('CommunicationRequest', {
        'based-on': getReferenceString(serviceRequest[0]),
      });
      expect(communicationRequest).toHaveLength(1);
      const transferPhysicianPhone = transferPhysician.telecom?.find((val) => val.system === 'phone')?.value;
      expect(communicationRequest[0]).toMatchObject({
        status: 'active',
        payload: [{ contentString: transferPhysicianPhone }],
      });

      // Task
      const task = await medplum.searchResources('Task', {
        'based-on': getReferenceString(serviceRequest[0]),
        focus: getReferenceString(communicationRequest[0]),
      });
      expect(task).toHaveLength(1);
      expect(task[0]).toMatchObject({
        status: 'ready',
        priority: 'asap',
        intent: 'plan',
        code: {
          coding: [{ system: 'http://hl7.org/fhir/CodeSystem/task-code', code: 'fulfill' }],
        },
        input: [
          {
            type: { coding: [{ code: 'comm_req', display: 'Communication request' }] },
            valueReference: { reference: getReferenceString(communicationRequest[0]) },
          },
          {
            type: { coding: [{ code: 'subject_patient', display: 'Patient' }] },
            valueReference: createReference(patient),
          },
        ],
      });
    });

    it('throws error on invalid transferring facility', async () => {
      const input: QuestionnaireResponse = createInput([
        {
          linkId: 'transferInfo',
          item: [
            {
              linkId: 'transferFacility',
              answer: [
                {
                  valueReference: {
                    reference: 'Location/123',
                    display: 'Acme Hospital',
                  },
                },
              ],
            },
          ],
        },
      ]);

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Transferring facility is not a valid reference to an Organization');
    });

    it('throws error on missing transferring physician name', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['transferPhysFirst', 'transferPhysLast']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Transferring Physician Name');
    });

    it('throws error on missing transferring physician phone', async () => {
      const input: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'completed',
        questionnaire: getReferenceString(questionnaire),
        item: removeItemsRecursively(requiredAnswerItems, ['transferPhysPhone']),
      };

      await expect(async () => {
        await handler(medplum, { bot, input, contentType, secrets: {} });
      }).rejects.toThrow('Missing required Transferring Physician Phone');
    });
  });
});
