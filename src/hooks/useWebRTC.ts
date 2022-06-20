import { useEffect, useState } from "react";

interface RTCPeerConnectionEventMap {
  connectionstatechange: Event;
  datachannel: RTCDataChannelEvent;
  icecandidate: RTCPeerConnectionIceEvent;
  icecandidateerror: Event;
  iceconnectionstatechange: Event;
  icegatheringstatechange: Event;
  negotiationneeded: Event;
  signalingstatechange: Event;
  track: RTCTrackEvent;
}

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
};

type RTCPeerConnectionProps = {
  RTCConfig: RTCConfigType;
};

function useRTCPeerConnection(props: RTCPeerConnectionProps) {
  const [peerConnection] = useState(
    typeof window !== "undefined"
      ? undefined
      : new RTCPeerConnection(props.RTCConfig)
  );

  useEffect(() => {
    if (!peerConnection) return;
    const iceGatheringStateChange = async () => {
      console.log("gatheringstate:" + peerConnection.iceGatheringState);
      if (peerConnection?.iceGatheringState === "complete") {
        //
      }
    };

    const connectionStateChange = async () => {
      console.log("connectionstatechange:" + peerConnection.connectionState);
    };

    const signalingState = async () => {
      console.log("signalingstate" + peerConnection.signalingState);
    };

    peerConnection.addEventListener(
      "connectionstatechange",
      connectionStateChange
    );

    peerConnection.addEventListener(
      "icegatheringstatechange",
      iceGatheringStateChange
    );

    peerConnection.addEventListener(
      "icegatheringstatechange",
      iceGatheringStateChange
    );

    peerConnection.addEventListener("signalingstatechange", signalingState);

    return () => {
      if (!peerConnection) return;

      peerConnection.removeEventListener(
        "icegatheringstatechange",
        iceGatheringStateChange
      );
      peerConnection.removeEventListener(
        "connectionstatechange",
        connectionStateChange
      );
      peerConnection.removeEventListener(
        "signalingstatechange",
        signalingState
      );
    };
  }, [peerConnection]);

  return {
    peerConnection,
  };
}

export function useWebRTC(props: useWebRTCProps) {
  const { peerConnection } = useRTCPeerConnection({
    RTCConfig: props.RTCConfig || servers,
  });

  const [localeStream, setLocaleStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [offer, setOffer] = useState<
    RTCSessionDescriptionInit | RTCSessionDescription
  >();
  const [answer, setAnswer] = useState<
    RTCSessionDescriptionInit | RTCSessionDescription
  >();

  const addCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection) return;
    if (peerConnection.currentRemoteDescription === null) return;
    peerConnection.addIceCandidate(candidate);
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
    let _remoteStream = new MediaStream();

    try {
      localeStream.getTracks().forEach((track) => {
        peerConnection?.addTrack(track, localeStream);
      })!;

      peerConnection.ontrack = async (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          _remoteStream.addTrack(track);
        });
      };
    } catch (error) {
      console.log("happens on:" + type, "localestream:", localeStream);
      throw error;
    }

    setRemoteStream(_remoteStream);

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        type === "offer"
          ? setOffer(peerConnection.localDescription!)
          : setAnswer(peerConnection.localDescription!);
        await props.onIceCandidate(JSON.stringify(event.candidate));
      }
    };
  };

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
      let _localeStream = await navigator.mediaDevices.getUserMedia(
        props.MediaConfig || {
          video: true,
        }
      );
      setLocaleStream(_localeStream);
      console.log("init localeStream done");
    } catch (error) {
      console.warn("Unable to get user media", error);
    }
  };

  const streamDisconnect = () => {
    console.log("Triggering stream disconnect");
  };

  return {
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
  };
}
