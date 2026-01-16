import { MockClient } from '@medplum/mock';
import { Questionnaire } from '@medplum/fhirtypes';
import { describe, expect, it, beforeEach } from 'vitest';
import { getQuestionnaireByName, getQuestionnaireReference } from './questionnaire';

describe('Questionnaire utilities', () => {
  let medplum: MockClient;

  beforeEach(() => {
    medplum = new MockClient();
  });

  describe('getQuestionnaireByName', () => {
    it('should return questionnaire when found by name', async () => {
      const mockQuestionnaire: Questionnaire = {
        resourceType: 'Questionnaire',
        id: 'test-questionnaire-id',
        name: 'patient-intake-questionnaire',
        status: 'active',
      };

      await medplum.createResource(mockQuestionnaire);

      const result = await getQuestionnaireByName(medplum, 'patient-intake-questionnaire');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-questionnaire-id');
      expect(result.name).toBe('patient-intake-questionnaire');
    });

    it('should throw error when questionnaire not found', async () => {
      await expect(
        getQuestionnaireByName(medplum, 'non-existent-questionnaire')
      ).rejects.toThrow('Questionnaire with name "non-existent-questionnaire" not found');
    });
  });

  describe('getQuestionnaireReference', () => {
    it('should return reference string for questionnaire', async () => {
      const mockQuestionnaire: Questionnaire = {
        resourceType: 'Questionnaire',
        id: 'test-questionnaire-123',
        name: 'physician-onboarding-questionnaire',
        status: 'active',
      };

      await medplum.createResource(mockQuestionnaire);

      const reference = await getQuestionnaireReference(
        medplum,
        'physician-onboarding-questionnaire'
      );

      expect(reference).toBe('Questionnaire/test-questionnaire-123');
    });

    it('should throw error when questionnaire not found', async () => {
      await expect(
        getQuestionnaireReference(medplum, 'missing-questionnaire')
      ).rejects.toThrow('Questionnaire with name "missing-questionnaire" not found');
    });
  });
});
