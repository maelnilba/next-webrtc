import { useWebRTC } from "@hooks/useWebRTC";
import { useEffectOnce } from "@hooks/useEffectOnce";

import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { channelEvent } from "./api/pusher";
import { usePusherEvents } from "@hooks/usePusher";
import { useLocaleStream } from "@hooks/useLocaleStream";

const Index: NextPage = () => {
  const [myid, setMyid] = useState((Math.random() * 1000).toString());
  const localeStream = useLocaleStream({
    config: {
      video: true,
    },
  });
  const messages = usePusherEvents();
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
    peerConnection,
    streamDisconnect,
    initLocaleStream,
    remoteStream: peerRemoteStream,
    createOffer,
    createAnswer,
    answer,
    offer,
    setOffer,
    addAnswer,
    setAnswer,
    addCandidate,
    peerConnectionStates,
  } = useWebRTC({ onIceCandidate: onCandidate, localeStream });

  useEffect(() => {
    const lastMessage = messages.slice(-1);
    console.log("messages:", lastMessage);
  }, [messages]);

  useEffectOnce(() => {
    initLocaleStream();
  });

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <div className="flex w-screen flex-row justify-around ">
        {localeStream && <VideoRTC stream={localeStream} />}
        {peerRemoteStream && <VideoRTC stream={peerRemoteStream} />}
      </div>
    </div>
  );
};

// useEffect(() => {
//   if (isMounted.current) return;
//   if (!localeStream) return;
//   console.log("useEffectTriggered");
//   isMounted.current = true;

//   const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
//     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//   });
//   fetchPusher({ type: "join", payload: "hello", sender: myid });

//   Pusher.logToConsole = false;
//   const channel = pusher.subscribe("channel");
//   // should determinates who's the sender
//   // use cleanup also, and renegotiate if the network changes
//   channel.bind("channel-event", async (data: channelEvent) => {
//     if (data.sender === myid) return;
//     // console.log("event-pusher:", data.type);
//     // console.log(localeStream, remoteStream);
//     // if message candidate add candidate peerConnection.addCandidate(candidate)
//     if (data.type === "candidate") {
//       addCandidate(JSON.parse(data.payload));
//     }

//     // create offer when member join then send back the offer
//     // also send candidate on ice candidate event => refer to onCandidate
//     if (data.type === "join") {
//       if (offer) return;
//       const _offer = await createOffer();
//       fetchPusher({
//         type: "offer",
//         payload: JSON.stringify(_offer),
//         sender: myid,
//       });
//     }
//     // create answer when we go a offer type and send it back
//     if (data.type === "offer") {
//       // when offer type check if there's localstream, if not create it
//       if (!localeStream) {
//         await initLocaleStream();
//       }

//       setOffer(JSON.parse(data.payload));
//       const _answer = await createAnswer(JSON.parse(data.payload));
//       fetchPusher({
//         type: "answer",
//         payload: JSON.stringify(_answer),
//         sender: myid,
//       });
//     }

//     // addanswer when we got a answer type
//     if (data.type === "answer") {
//       setAnswer(JSON.parse(data.payload));
//       addAnswer(JSON.parse(data.payload));
//       fetchPusher({ type: "accept", payload: "accept", sender: myid });
//     }

//     // check if should work
//     if (data.type === "accept") {
//       console.log("ACCEPTED", localeStream, remoteStream);
//       console.log({ peerConnection });
//     }
//   });

//   return () => {
//     pusher.unsubscribe("channel");
//   };
// }, [localeStream, remoteStream]);

const VideoRTC: React.FC<{ stream: MediaStream | undefined }> = ({
  stream,
}) => {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!stream) return;
    if (!streamRef.current) return;
    streamRef.current.srcObject = stream;
  }, [streamRef]);
  // console.log("VideoRTC", stream);
  if (!stream?.active) return null;
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
