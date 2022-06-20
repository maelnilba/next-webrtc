import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
const Index: NextPage = () => {
  const [peerConnection] = useState(
    typeof window === "undefined" ? undefined : new RTCPeerConnection(servers)
  );
  const [localeStream, setLocaleStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const localeStreamRef = useRef<HTMLVideoElement>(null);
  const remoteStreamRef = useRef<HTMLVideoElement>(null);

  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");

  const init = async () => {
    let _localeStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    localeStreamRef.current!.srcObject = _localeStream;
    setLocaleStream(_localeStream);
  };

  const createOffer = async () => {
    if (!localeStream || !peerConnection) return;
    let _remoteStream = new MediaStream();
    remoteStreamRef.current!.srcObject = _remoteStream;

    localeStream.getTracks().forEach((track) => {
      peerConnection?.addTrack(track, localeStream);
    })!;

    peerConnection.ontrack = async (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        _remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        setOffer(JSON.stringify(peerConnection.localDescription));
      }
    };

    let offer = await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(offer);
    setRemoteStream(_remoteStream);
    setOffer(JSON.stringify(offer));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <div className="flex w-screen flex-row justify-around ">
        <video
          className="m-12 border border-stone-300 bg-blue-400"
          ref={localeStreamRef}
          autoPlay
          playsInline
        ></video>
        <video
          ref={remoteStreamRef}
          className=" m-12 border border-stone-300  bg-blue-400"
          autoPlay
          playsInline
        ></video>
      </div>
      <div className="flex w-full flex-col space-y-2  px-4">
        <button
          className="rounded-xl bg-blue-200 p-2 text-2xl text-black"
          onClick={createOffer}
        >
          Create offer
        </button>
        <textarea value={offer} onChange={() => {}}></textarea>
        <button className="rounded-xl bg-blue-200 p-2 text-2xl text-black">
          Create answer
        </button>
        <textarea onChange={() => {}} value={answer}></textarea>
        <button className="rounded-xl bg-blue-200 p-2 text-2xl text-black">
          add answer
        </button>
      </div>
    </div>
  );
};

export default Index;
