import Pusher, { PresenceChannel } from "pusher-js";
import { useEffect, useState } from "react";

let pusherClient: Pusher | null = null;
export const usePusher = () => {
  const [, forceRerender] = useState<number>(0);
  useEffect(() => {
    if (pusherClient) return;
    Pusher.logToConsole = true; // process.env.NODE_ENV !== "production";
    const newClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      authEndpoint: "/api/pusher/auth",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherClient = newClient;
    forceRerender(Math.random());
  }, []);

  return pusherClient;
};

export const usePusherEvents = () => {
  const pusherClient = usePusher();
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    if (!pusherClient) return;
    const onEvent = (data: any, metadata: any) => {
      console.log("onEvent_data:", data, "metadata:", metadata);
      setMessages((prev) => [...prev, { data, metadata }]);
    };
    console.log("we are connected to pusher");
    const channel = pusherClient.subscribe(
      "presence-channel"
    ) as PresenceChannel;
    channel.bind("channel-event", onEvent);
    channel.bind("pusher:subscription_succeeded", (data: any) => {
      console.log("pusher:subscription_succeeded", data);
    });
    channel.bind("pusher:member_added", (member: { id: string; info: any }) => {
      console.log("pusher:member_added", member);
    });
    return () => {
      pusherClient.unsubscribe("presence-channel");
    };
  }, [pusherClient]);
  return messages;
};
