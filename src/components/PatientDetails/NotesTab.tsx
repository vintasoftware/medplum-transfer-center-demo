import { Blockquote, Text, Stack } from '@mantine/core';
import { Annotation, ServiceRequest } from '@medplum/fhirtypes';

interface NotesTabProps {
  serviceRequest: ServiceRequest;
}

export function NotesTab(props: NotesTabProps): JSX.Element {
  const { serviceRequest } = props;
  const notes = serviceRequest.note;

  if (!notes) {
    return <Text>No Notes</Text>;
  }

  // Sort notes so the most recent are at the top of the page
  const sortedNotes = sortNotesByTime(notes);

  return (
    <Stack>
      {sortedNotes.map((note) =>
        note.text ? (
          <Blockquote
            key={`note-${note.text}`}
            cite={`${note.authorReference?.display || note.authorString} – ${note.time?.slice(0, 10)}`}
            icon={null}
          >
            {note.text}
          </Blockquote>
        ) : null
      )}
    </Stack>
  );
}

function sortNotesByTime(notes: Annotation[]): Annotation[] {
  const compareTimes = (a: Annotation, b: Annotation): number => {
    const timeA = new Date(a.time || 0).getTime();
    const timeB = new Date(b.time || 0).getTime();
    return timeB - timeA;
  };

  const sortedNotes = notes.sort(compareTimes);
  return sortedNotes;
}
