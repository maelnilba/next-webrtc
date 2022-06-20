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

  const createPeerConnection = async (type: "offer" | "answer") => {
    if (!peerConnection) return;
    if (!localeStream) return;
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

    setRemoteStream(_remoteStream);

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        type === "offer"
          ? setOffer(JSON.stringify(peerConnection.localDescription))
          : setAnswer(JSON.stringify(peerConnection.localDescription));
      }
    };
  };

  const createOffer = async () => {
    await createPeerConnection("offer");

    let offer = await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(offer);
    setOffer(JSON.stringify(offer));
  };

  const createAnswer = async () => {
    await createPeerConnection("answer");

    if (!offer) return;
    await peerConnection!.setRemoteDescription(JSON.parse(offer));

    let _answer = await peerConnection!.createAnswer();
    await peerConnection!.setLocalDescription(_answer);
    setAnswer(JSON.stringify(_answer));
  };

  const addAnswer = async () => {
    if (!answer) return;
    if (!peerConnection?.currentRemoteDescription) {
      peerConnection?.setRemoteDescription(JSON.parse(answer));
    }
  };
  useEffect(() => {
    init();
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-blue-300">
      <div className="flex w-screen flex-row justify-around ">
        <div className="w-auto">
          <video
            className="border border-stone-300 bg-blue-400"
            ref={localeStreamRef}
            autoPlay
            playsInline
          ></video>
        </div>
        <div className="w-auto">
          <video
            ref={remoteStreamRef}
            className="border border-stone-300  bg-blue-400"
            autoPlay
            playsInline
          ></video>
        </div>
      </div>
      <div className="flex w-full flex-col space-y-2  px-4">
        <button
          className="rounded-xl bg-blue-200 p-2 text-2xl text-black"
          onClick={createOffer}
        >
          Create offer
        </button>
        <textarea
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
        ></textarea>
        <button
          className="rounded-xl bg-blue-200 p-2 text-2xl text-black"
          onClick={createAnswer}
        >
          Create answer
        </button>
        <textarea
          onChange={(e) => setAnswer(e.target.value)}
          value={answer}
        ></textarea>
        <button
          className="rounded-xl bg-blue-200 p-2 text-2xl text-black"
          onClick={addAnswer}
        >
          add answer
        </button>
      </div>
    </div>
  );
};

export default Index;
