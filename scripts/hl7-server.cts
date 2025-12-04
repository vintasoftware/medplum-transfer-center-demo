import { Hl7Server } from '@medplum/hl7';

const server = new Hl7Server((connection) => {
  connection.addEventListener('message', (event) => {
    console.log(
      `Received HL7 message from ${connection.socket.remoteAddress}:${
        connection.socket.remotePort
      }:\n\n${event.message.toString()}`
    );
    connection.send(event.message.buildAck());
  });
});

const parsedPort = process.env.PORT ? parseInt(process.env.PORT) : NaN;
server.start(!isNaN(parsedPort) ? parsedPort : 57099);
