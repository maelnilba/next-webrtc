import { useEffect, useState } from "react";
import { useRTCPeerConnection } from "@hooks/useRTCPeerConnection";

// https://github.com/web-platform-tests/wpt/blob/master/webrtc/RTCPeerConnection-helper.js#L191

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

type RTCConfigType = typeof servers;

type useWebRTCProps = {
  RTCConfig?: RTCConfigType;
  MediaConfig?: MediaStreamConstraints;
  onIceCandidate: (...args: any[]) => Promise<any>;
  localeStream?: MediaStream;
};

export function useWebRTC(props: useWebRTCProps) {
  const {
    peerConnection,
    waitForIceGatheringState,
    waitForConnectionStateChange,
    connectionState,
    iceGatheringState,
    iceConnectionState,
    signalingState,
  } = useRTCPeerConnection({
    RTCConfig: props.RTCConfig || servers,
  });

  const [localeStream, setLocaleStream] = useState<MediaStream | undefined>(
    props.localeStream
  );
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [candidates, setCandidates] = useState<RTCIceCandidateInit[]>([]);
  const [offer, setOffer] = useState<
    RTCSessionDescriptionInit | RTCSessionDescription
  >();
  const [answer, setAnswer] = useState<
    RTCSessionDescriptionInit | RTCSessionDescription
  >();

  const addCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection) return;
    // add to a queue until states is OK for set them
    setCandidates((prev) => [...prev, candidate]);
    // peerConnection.addIceCandidate(candidate);
  };

  const createPeerConnection = async ({
    type,
  }: {
    type: "answer" | "offer";
  }) => {
    if (!peerConnection) {
      throw new Error(`peerConnection is not defined in ${type}`);
    }
    if (!localeStream) {
      throw new Error(`localeStream is not defined in ${type}`);
    }
    if (!remoteStream) {
      throw new Error(`remoteStream is not defined in ${type}`);
    }

    try {
      localeStream.getTracks().forEach(async (track) => {
        // if (peerConnection.connectionState === "new")
        await waitForConnectionStateChange(peerConnection, ["new"]);
        peerConnection?.addTrack(track, localeStream);
      })!;

      peerConnection.ontrack = async (event) => {
        event.streams[0]?.getTracks().forEach(async (track) => {
          // if (peerConnection.connectionState === "new")
          await waitForConnectionStateChange(peerConnection, ["new"]);
          remoteStream.addTrack(track);
        });
      };
    } catch (error) {
      console.log("Peer connection error", { peerConnection });
      throw error;
    }

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        type === "offer"
          ? setOffer(peerConnection.localDescription!)
          : setAnswer(peerConnection.localDescription!);
        await props.onIceCandidate(JSON.stringify(event.candidate));
      }
    };
  };
  // Send CreateOffer from Caller (signalling part; custom transport to the other users);
  // enable PeerConnection.onnegotiationneeded => CreateOffer() only for Caller

  // Callee can be ready with video/audio streams added it to RTCPeerConnection on its side,
  // then accepts offer and sends answer to Caller (signalling part)

  // Caller gets the answer
  // and adds the video/audio streams to RTCPeerConnection conditionally when PeerConnection.connectionState == "new",
  // the tricky parts: condition connectionState == "new" ensures it does not add again as offer / answer
  // might be exchanged many times with state being connecting etc.
  // Another is, if you add video/audio streams before this step,
  // it will be hard to control the ice sdp flowing
  // and raising errors at wrong states (relates to comment from Benjamin Trent, here) (signalling part)

  // since offer, answer is exchanged, now many ice events flows are exchanged (signalling part)

  // Connection should be established (assuming STUN configured and if peer to peer not possible, TURN required)

  const createOffer = async () => {
    await createPeerConnection({ type: "offer" });
    let _offer = await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(_offer);
    setOffer(_offer);

    return _offer;
  };

  const createAnswer = async (
    _offer?: RTCSessionDescription | RTCSessionDescriptionInit
  ) => {
    await createPeerConnection({ type: "answer" });
    if (!offer && !_offer) return;

    if (offer) {
      await peerConnection!.setRemoteDescription(offer);
    } else if (_offer) {
      await peerConnection!.setRemoteDescription(_offer);
    }

    let _answer = await peerConnection!.createAnswer();
    await peerConnection!.setLocalDescription(_answer);
    setAnswer(_answer);
    return _answer;
  };

  const addAnswer = async (
    _answer?: RTCSessionDescription | RTCSessionDescriptionInit
  ) => {
    if (!answer && !_answer) return;
    if (!peerConnection?.currentRemoteDescription) {
      if (answer) {
        peerConnection?.setRemoteDescription(answer);
      } else if (_answer) {
        peerConnection?.setRemoteDescription(_answer);
      }
    }
  };

  const initLocaleStream = async () => {
    try {
      console.log("states of stream ?", props.localeStream);
      let _localeStream =
        props.localeStream ||
        (await navigator.mediaDevices.getUserMedia(
          props.MediaConfig || {
            video: true,
          }
        ));

      console.log("The localeStream is set to peer connection");

      setLocaleStream(_localeStream);
      setRemoteStream(new MediaStream());
    } catch (error) {
      console.warn("Unable to get user media", error);
    }
  };

  const streamDisconnect = () => {
    console.log("Triggering stream disconnect");
  };

  useEffect(() => {
    if (props.localeStream) setLocaleStream(localeStream);
  }, [props.localeStream]);

  useEffect(() => {
    // should make other than useeffect imo
    // maybe possible based on offer/answer description if it's in accept or addanswer
    if (!peerConnection) return;
    if (!offer && !answer) {
      // console.log("answer:", answer, "offer:", offer);
      return;
    }
    waitForIceGatheringState(peerConnection!, ["complete"]).then(() => {
      console.log("ice gathering complete");
      console.log("candidates:", candidates);
      candidates.forEach((candidate) => {
        peerConnection.addIceCandidate(candidate);
      });
    });
  }, [answer, offer]);

  return {
    peerConnection,
    initLocaleStream,
    streamDisconnect,
    localeStream,
    remoteStream,
    offer,
    setOffer,
    answer,
    setAnswer,
    createOffer,
    createAnswer,
    addAnswer,
    addCandidate,
    peerConnectionStates: {
      connectionState,
      iceConnectionState,
      iceGatheringState,
      signalingState,
    },
  };
}
