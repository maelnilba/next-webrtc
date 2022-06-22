import Pusher from "pusher-js";
import { useEffect, useState } from "react";

let pusherClient: Pusher | null = null;
export const usePusher = () => {
  const [, forceRerender] = useState<number>(0);
  useEffect(() => {
    if (pusherClient) return;
    Pusher.logToConsole = process.env.NODE_ENV !== "production";
    const newClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      authEndpoint: "/api/pusher/auth",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherClient = newClient;
    forceRerender(Math.random());
  }, []);

  return pusherClient;
};
