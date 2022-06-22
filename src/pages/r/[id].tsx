import { usePusher } from "@hooks/usePusher";
import { useWebRTC } from "@hooks/useWebRTC";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Pusher, { Channel, Members, PresenceChannel } from "pusher-js";
import { useEffect, useRef, useState } from "react";

const Index: NextPage = () => {
  const router = useRouter();
  const room = router.query.id;
  const pusherClient = usePusher();
  if (!room || typeof room !== "string") return <Spinner />;

  if (!pusherClient) return <Spinner />;
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-800">
      <div className="absolute top-1 my-2 text-4xl capitalize">{room}</div>
      <Room
        client={pusherClient}
        roomId={room.replaceAll("/", "").replaceAll(" ", "")}
      ></Room>
    </div>
  );
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
  if (!me || !socketId) return <Spinner />;
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

  const getRatio = (lenght: number) => {
    if (lenght === 1) return 50;
    if (lenght === 2) return 40;
    if (lenght >= 3) return 28;
    if (lenght >= 6) return 16;
  };
  return (
    <div className="flex h-full w-full flex-wrap items-center justify-center space-x-2 ">
      {clients.map((client: any, _: any, arrs: any[]) => {
        return (
          <VideoRTC
            key={client.id}
            props={{
              provider: provideRef,
              id: client.id,
              isTalking: client?.isTalking,
              ratio: getRatio(arrs.length),
            }}
          />
        );
      })}
    </div>
  );
};

const VideoRTC: React.FC<{ props?: any }> = ({ props }) => {
  const streamRef = useRef<HTMLVideoElement>(null);

  // const click = () => {
  //   console.log((streamRef.current?.srcObject as MediaStream)?.active);
  // };
  useEffect(() => {
    props.provider(streamRef.current, props.id);
  }, []);
  return (
    <div
      className={`relative mt-2 flex w-[${
        props.ratio
      }rem] justify-center overflow-hidden rounded-2xl border-4 border-${
        props.isTalking ? "blue" : "slate"
      }-500 shadow-${
        props.isTalking ? "blue" : "slate"
      }-500/90 bg-slate-500  shadow-2xl`}
    >
      <Spinner />
      <div className="z-10">
        <video
          className=" aspect-[4/3]"
          width={`${props.ratio * 16}rem`}
          ref={streamRef}
          autoPlay
        />
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
    <svg
      role="status"
      className="mr-2 h-8 w-8 animate-spin fill-slate-600 text-gray-200 dark:text-gray-600"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      ></path>
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      ></path>
    </svg>
  </div>
);

export default Index;
