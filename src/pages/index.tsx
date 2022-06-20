import { useWebRTC } from "@hooks/useWebRTC";
import { useEffectOnce } from "@hooks/useEffectOnce";

import type { NextPage } from "next";
import Pusher from "pusher-js";
import { useEffect, useRef, useState } from "react";
import { channelEvent } from "./api/pusher";

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
const Index: NextPage = () => {
  const [myid, setMyid] = useState((Math.random() * 1000).toString());
  const isMounted = useRef(false);
  const fetchPusher = async ({ payload, sender, type }: channelEvent) => {
    await fetch("api/pusher", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        payload,
        sender,
      }),
    });
  };

  const onCandidate = async (candidate: string) => {
    await fetchPusher({ type: "candidate", payload: candidate, sender: myid });
  };
  const {
    streamDisconnect,
    initLocaleStream,
    localeStream,
    remoteStream,
    createOffer,
    createAnswer,
    answer,
    offer,
    setOffer,
    addAnswer,
    setAnswer,
    addCandidate,
  } = useWebRTC({ onIceCandidate: onCandidate });

  // get id by users

  useEffect(() => {
    if (isMounted.current) return;
    if (!localeStream) return;
    console.log("useEffectTriggered");
    isMounted.current = true;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    fetchPusher({ type: "join", payload: "hello", sender: myid });

    Pusher.logToConsole = false;
    const channel = pusher.subscribe("channel");

    channel.bind("channel-event", async (data: channelEvent) => {
      if (data.sender === myid) return;
      console.log(data.type);
      if (data.type === "disconnect") {
        streamDisconnect();
      }
      // if message candidate add candidate peerConnection.addCandidate(candidate)
      if (data.type === "candidate") {
        addCandidate(JSON.parse(data.payload));
      }

      // create offer when member join then send back the offer
      // also send candidate on ice candidate event => refer to onCandidate
      if (data.type === "join") {
        if (offer) return;
        const _offer = await createOffer();
        fetchPusher({
          type: "offer",
          payload: JSON.stringify(_offer),
          sender: myid,
        });
      }
      // create answer when we go a offer type and send it back
      if (data.type === "offer") {
        // when offer type check if there's localstream, if not create it
        if (!localeStream) {
          await initLocaleStream();
        }

        setOffer(JSON.parse(data.payload));
        const _answer = await createAnswer(JSON.parse(data.payload));
        fetchPusher({
          type: "answer",
          payload: JSON.stringify(_answer),
          sender: myid,
        });
      }

      // addanswer when we got a answer type
      if (data.type === "answer") {
        setAnswer(JSON.parse(data.payload));
        console.log("addAnswer");
        addAnswer(JSON.parse(data.payload));
        fetchPusher({ type: "accept", payload: "accept", sender: myid });
      }

      // check if should work
      if (data.type === "accept") {
        console.log("ACCEPTED", localeStream, remoteStream);
      }
    });

    return () => {
      pusher.unsubscribe("channel");
    };
  }, [localeStream]);

  useEffectOnce(() => {
    initLocaleStream();
  });

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <div className="flex w-screen flex-row justify-around ">
        {localeStream && <VideoRTC stream={localeStream} />}
        {remoteStream && <VideoRTC stream={remoteStream} />}
      </div>
    </div>
  );
};

const VideoRTC: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
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
