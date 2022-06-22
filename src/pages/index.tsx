import { usePusher } from "@hooks/usePusher";
import { useWebRTC } from "@hooks/useWebRTC";

import type { NextPage } from "next";
import Pusher, { Channel, Members, PresenceChannel } from "pusher-js";
import { useEffect, useRef, useState } from "react";

const Index: NextPage = () => {
  const roomId = "room1";
  const pusherClient = usePusher();

  if (!pusherClient) return <div>waiting for pusher...</div>;
  return <Room client={pusherClient} roomId={roomId}></Room>;
};

const Room: React.FC<{ client: Pusher; roomId: string }> = ({
  client,
  roomId,
}) => {
  const [, forceRerender] = useState<number>(0);
  const [me, setMe] = useState<any>(null);
  const [socketId, setSocketId] = useState<string>("");
  const socket = useRef<PresenceChannel | null>(null);
  const emitter = useRef<Channel | null>(null);

  useEffect(() => {
    const channel = client.subscribe(
      `presence-channel-${roomId}`
    ) as PresenceChannel;

    channel.bind("pusher:member_added", () => null);

    channel.bind("pusher:subscription_succeeded", (members: Members) => {
      setMe({
        id: members.myID,
        name: "nib",
      });
      setSocketId(client.connection.socket_id);
    });

    socket.current = channel;
    return () => {
      client.unsubscribe(`presence-channel-${roomId}`);
    };
  }, []);

  useEffect(() => {
    if (!socketId) return;
    const socketChannel = client.subscribe(
      `socket-channel-${socketId}-${roomId}`
    );
    emitter.current = socketChannel;
    forceRerender(Math.random());
    return () => {
      if (!socketId) return;
      client.unsubscribe(`socket-channel-${socketId}-${roomId}`);
    };
  }, [socketId]);
  if (!me || !socketId) return <div></div>;
  if (!socket.current || !emitter.current)
    return (
      <div>
        {!!socket.current ? "true" : "false"} --{" "}
        {!!emitter.current ? "true" : "false"}
      </div>
    );
  return (
    <RoomChat
      socket={socket.current}
      emitter={emitter.current}
      socketId={socketId}
      user={me}
      roomId={roomId}
    />
  );
};

const RoomChat: React.FC<{
  socket: PresenceChannel;
  emitter: Channel;
  socketId: string;
  user: any;
  roomId: string;
}> = ({ socket, socketId, user, emitter, roomId }) => {
  const { clients, provideRef } = useWebRTC(
    {
      roomId,
      socket,
      emitter,
      socketId,
      user,
    },
    {
      audio: false,
      video: true,
    }
  );
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <pre>{JSON.stringify(clients)}</pre>
      <div>Room Chat</div>
      <div>SocketID = {socketId}</div>
      {clients.map((client: any) => {
        return (
          <div key={client.id}>
            <audio
              ref={(instance) => provideRef(instance, client.id)}
              autoPlay
            ></audio>
            <video
              ref={(instance) => provideRef(instance, client.id)}
              autoPlay
            />
          </div>
        );
      })}
    </div>
  );
};

const VideoRTC: React.FC<{ stream: MediaStream | undefined }> = ({
  stream,
}) => {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!stream) return;
    if (!streamRef.current) return;
    streamRef.current.srcObject = stream;
  }, [streamRef]);

  return (
    <div className="w-auto">
      <video
        className="border border-stone-300 bg-blue-400"
        ref={streamRef}
        autoPlay
        playsInline
      ></video>
    </div>
  );
};

export default Index;
