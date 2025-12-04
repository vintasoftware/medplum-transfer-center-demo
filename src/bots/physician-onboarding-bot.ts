import { BotEvent, MedplumClient, createReference, getQuestionnaireAnswers } from '@medplum/core';
import { Coding, Practitioner, QuestionnaireResponse, QuestionnaireResponseItemAnswer } from '@medplum/fhirtypes';
import { SAMPLE_MED_ORG_ID } from '@/constants';

type PractitionerLinkId = 'prefix' | 'firstName' | 'lastName' | 'suffix' | 'phoneNo' | 'specialty';
type ValidLinkId = PractitionerLinkId;

type ParsedResults = {
  practitioner: Practitioner;
  specialty: Coding;
};

export async function handler(medplum: MedplumClient, event: BotEvent<QuestionnaireResponse>): Promise<void> {
  const results = {
    practitioner: { resourceType: 'Practitioner' } satisfies Practitioner,
  } as ParsedResults;

  if (event.input?.resourceType !== 'QuestionnaireResponse') {
    throw new Error('Invalid input');
  }

  const answers = getQuestionnaireAnswers(event.input);

  const parseAnswer = async (linkId: ValidLinkId, answer: QuestionnaireResponseItemAnswer): Promise<void> => {
    const { practitioner } = results;

    if (!practitioner.name) {
      practitioner.name = [{}];
      return;
    }

    switch (linkId) {
      case 'prefix': {
        const prefix = answer.valueString;
        if (!prefix) {
          throw new Error('Missing prefix value for physician');
        }
        practitioner.name[0].prefix = prefix.split(' ');
        return;
      }
      case 'suffix': {
        const suffix = answer.valueString;
        if (!suffix) {
          throw new Error('Missing suffix value for physician');
        }
        practitioner.name[0].suffix = suffix.split(' ');
        return;
      }
      case 'firstName': {
        const firstName = answer.valueString;
        if (!firstName) {
          throw new Error('Failed to parse valid string from item with linkId firstName');
        }
        practitioner.name[0].given = [firstName];
        return;
      }
      case 'lastName': {
        const lastName = answer.valueString;
        if (!lastName) {
          throw new Error('Failed to parse valid string from item with linkId lastName');
        }
        practitioner.name[0].family = lastName;
        return;
      }
      case 'phoneNo': {
        const phoneNo = answer.valueString;
        if (!phoneNo) {
          throw new Error('No phone number provided');
        }
        results.practitioner.telecom = [{ system: 'phone', value: phoneNo }];
        return;
      }
      case 'specialty': {
        const acceptingSpecialty = answer.valueCoding;
        if (!acceptingSpecialty) {
          throw new Error('Accepting specialty not selected');
        }
        results.specialty = acceptingSpecialty;
        return;
      }
      default:
      // Ignore linkIds we don't recognize
    }
  };

  for (const [linkId, answer] of Object.entries(answers)) {
    await parseAnswer(linkId as ValidLinkId, answer);
  }

  if (!(results.practitioner?.name?.[0]?.given?.length && results.practitioner?.name?.[0].family)) {
    throw new Error('Physician details missing or no available room found');
  }

  if (!results.practitioner?.telecom?.[0]) {
    throw new Error('Missing required transfer physician phone number');
  }

  if (!results.specialty) {
    throw new Error('No specialty given for physician');
  }

  // After processing all items from QuestionnaireResponse,
  // We can process the data we parsed from it

  // Create the patient in Medplum
  // TODO: Create if not exists
  const practitioner = await medplum.createResource(results.practitioner);

  // Create PractitionerRole for SAMPLE MED
  await medplum.createResource({
    resourceType: 'PractitionerRole',
    practitioner: createReference(practitioner),
    organization: createReference({ resourceType: 'Organization', id: SAMPLE_MED_ORG_ID }),
    specialty: [{ coding: [results.specialty] }],
  });
}
