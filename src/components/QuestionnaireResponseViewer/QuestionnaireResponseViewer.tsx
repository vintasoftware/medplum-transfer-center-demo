import { Stack, Text, Title, TitleOrder } from '@mantine/core';
import { formatDate, resolveId } from '@medplum/core';
import {
  QuestionnaireResponse,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  Reference,
} from '@medplum/fhirtypes';
import {
  CodeableConceptDisplay,
  Document,
  QuantityDisplay,
  RangeDisplay,
  ReferenceDisplay,
  useMedplum,
} from '@medplum/react';

interface ItemDisplayProps {
  item: QuestionnaireResponseItem;
  omittedItems?: string[];
  order: TitleOrder;
}

function ItemDisplay({ item, omittedItems, order }: ItemDisplayProps): JSX.Element {
  const { text: title, answer, item: nestedAnswers } = item;

  if (omittedItems?.includes(item.linkId)) {
    return <></>;
  }

  function renderContent(): JSX.Element {
    if (answer && answer.length > 0) {
      return <AnswerDisplay key={answer[0].id} answer={answer[0]} />;
    } else if (nestedAnswers && nestedAnswers.length > 0) {
      return (
        <>
          {nestedAnswers.map((nestedAnswer) =>
            omittedItems?.includes(nestedAnswer.linkId) ? null : (
              <ItemDisplay key={nestedAnswer.id} item={nestedAnswer} order={Math.min(order + 1, 6) as TitleOrder} />
            )
          )}
        </>
      );
    } else {
      return <Text c="dimmed">No answer</Text>;
    }
  }

  return (
    <Stack>
      <Title order={order}>{title}</Title>
      <Stack key={item.linkId}>{renderContent()}</Stack>
    </Stack>
  );
}

interface AnswerDisplayProps {
  answer: QuestionnaireResponseItemAnswer;
}

function AnswerDisplay({ answer }: AnswerDisplayProps): JSX.Element {
  if (!answer) {
    throw new Error('No answer');
  }
  const [[key, value]] = Object.entries(answer);

  switch (key) {
    case 'valueInteger':
      return <Text>{value}</Text>;
    case 'valueQuantity':
      return <QuantityDisplay value={value} />;
    case 'valueString':
      return <Text>{value}</Text>;
    case 'valueCoding':
      return <CodeableConceptDisplay value={{ coding: [value] }} />;
    case 'valueRange':
      return <RangeDisplay value={value} />;
    case 'valueDateTime':
      return <Text>{formatDate(value)}</Text>;
    case 'valueBoolean':
      return <Text>{value ? 'True' : 'False'}</Text>;
    case 'valueReference':
      return <ReferenceDisplay value={value} />;
    default:
      return <Text>{value.toString()}</Text>;
  }
}

type QuestionnaireResponseViewerProps = {
  response: Reference<QuestionnaireResponse>;
};

export function QuestionnaireResponseViewer(props: QuestionnaireResponseViewerProps): JSX.Element {
  const medplum = useMedplum();

  const questionnaireResponse = medplum
    .readResource('QuestionnaireResponse', resolveId(props.response) as string)
    .read();

  const omittedItems = [
    'agreement-to-pay-for-treatment-help',
    'notice-of-privacy-practices-help',
    'acknowledgement-for-advance-directives-help',
    'requisitionId',
  ];
  const items = questionnaireResponse?.item || [];

  return (
    <Document>
      <Title order={1} mb="lg">
        Patient Intake Form Response
      </Title>
      <Stack>
        {items.map((item) => (
          <ItemDisplay key={item.linkId} item={item} omittedItems={omittedItems} order={4} />
        ))}
      </Stack>
    </Document>
  );
}
