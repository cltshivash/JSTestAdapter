import { Message, MessageType } from '../../../../src/JSTest.Runner/ObjectModel';
import { CommunicationManager } from '../../../../src/JSTest.Runner/Environment/Node/CommunicationManager';
import { Environment } from '../../../../src/JSTest.Runner/Environment/Node/Environment';
import { MessageReceivedEventArgs } from '../../../../src/JSTest.Runner/Environment/ICommunicationManager';
import { Socket } from 'net';
import { It, Mock, Times, IMock } from 'typemoq';
import * as Assert from 'assert';

describe('Node/CommunicationManager Suite', () => {
    let mockSocket: IMock<Socket>;
    let commManager: CommunicationManager;

    before(() => {
        mockSocket = Mock.ofType(Socket);
        commManager = new CommunicationManager(new Environment(), mockSocket.object);
    });

    it('connectToServer will call socket.connect', (done: any) => {
        commManager.connectToServer('127.0.0.1', 1234);
        mockSocket.verify((x) => x.connect(It.isValue(1234), It.isValue('127.0.0.1'), It.isAny()), Times.once());
        done();
    });

    it('sendMessage will send message in correct format', (done: any) => {
        commManager.sendMessage(new Message(MessageType.ConsoleMessage, 'console message', 2));
        mockSocket.verify((x) => x.write('O{"Version":2,"MessageType":"JSTest.ConsoleMessage","Payload":"console message"}', 'binary'),
                          Times.once());
        
        done();
    });

    it('Constructor will hook to socket\'s \'data\' event', (done: any) => {
        mockSocket.verify((x) => x.on('data', It.isAny()), Times.once());
        done();
    });

    it('Will raise onMessageReceived when socket emits \'data\' event', (done: any) => {
        const mockSocket = Mock.ofType(Socket);
        mockSocket.callBase = true;

        const commManager = new CommunicationManager(new Environment(), mockSocket.object);

        commManager.onMessageReceived.subscribe((sender: Object, args: MessageReceivedEventArgs) => {
            Assert.equal(args.Message.MessageType, MessageType.ConsoleMessage);
            Assert.equal(args.Message.Payload, 'console message');
            done();
        });

        mockSocket.object.emit('data', new Buffer('O{"Version":2,"MessageType":"JSTest.ConsoleMessage","Payload":"console message"}'));
    });

    it('Will raise onMessageReceived when socket emits \'data\' event with chunked data', (done: any) => {
        const mockSocket = Mock.ofType(Socket);
        mockSocket.callBase = true;

        const commManager = new CommunicationManager(new Environment(), mockSocket.object);

        commManager.onMessageReceived.subscribe((sender: Object, args: MessageReceivedEventArgs) => {
            Assert.equal(args.Message.MessageType, MessageType.ConsoleMessage);
            Assert.equal(args.Message.Payload, 'console message');
            done();
        });

        mockSocket.object.emit('data', new Buffer('O{"Version":2,"MessageType":"'));
        mockSocket.object.emit('data', new Buffer('JSTest.ConsoleMessage","Payload":"console message"}'));
    });
});