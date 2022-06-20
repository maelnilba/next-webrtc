import { useState, useEffect } from "react";

type RTCPeerConnectionProps = {
  RTCConfig: RTCConfiguration;
};

export function useRTCPeerConnection(props: RTCPeerConnectionProps) {
  const [peerConnection] = useState(
    typeof window === "undefined"
      ? undefined
      : new RTCPeerConnection(props.RTCConfig)
  );
  const [iceGatheringState, setIceGatheringState] =
    useState<RTCIceGatheringState>("new");

  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [signalingState, setSignalingState] =
    useState<RTCSignalingState>("stable");
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
  const [iceConnectionState, setIceConnectionState] =
    useState<RTCIceConnectionState>();

  useEffect(() => {
    if (!peerConnection) return;

    const connectionStateChange = async () => {
      console.log("connectionstatechange:" + peerConnection.connectionState);
      setConnectionState(peerConnection.connectionState);
    };

    peerConnection.addEventListener(
      "connectionstatechange",
      connectionStateChange
    );
    const iceGatheringStateChange = async () => {
      console.log("gatheringstate:" + peerConnection.iceGatheringState);
      if (peerConnection?.iceGatheringState === "complete") {
        //
      }
      setIceGatheringState(peerConnection.iceGatheringState);
    };

    peerConnection.addEventListener(
      "icegatheringstatechange",
      iceGatheringStateChange
    );

    const signalingState = async () => {
      console.log("signalingstate" + peerConnection.signalingState);
      setSignalingState(peerConnection.signalingState);
    };
    peerConnection.addEventListener("signalingstatechange", signalingState);

    const dataChannel = async (event: RTCDataChannelEvent) => {
      console.log("dataChannel:" + event.channel);
      setDataChannel(event.channel);
    };
    peerConnection.addEventListener("datachannel", dataChannel);

    const iceConnectionStateChange = async () => {
      setIceConnectionState(peerConnection.iceConnectionState);
      console.log(
        "iceconnectionstatechange:" + peerConnection.iceConnectionState
      );
    };

    peerConnection.addEventListener(
      "iceconnectionstatechange",
      iceConnectionStateChange
    );

    const iceCandidateError = async (event: Event) => {
      console.log("icecandidateerror:" + event);
    };
    peerConnection.addEventListener("icecandidateerror", iceCandidateError);

    const iceCandidate = async (event: RTCPeerConnectionIceEvent) => {
      console.log("icecandidate:" + event.candidate);
    };
    peerConnection.addEventListener("icecandidate", iceCandidate);

    const negotiationNeeded = async (event: Event) => {
      console.log("negotiationneeded:" + event);
    };
    peerConnection.addEventListener("negotiationneeded", negotiationNeeded);
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

      peerConnection.removeEventListener("datachannel", dataChannel);

      peerConnection.removeEventListener(
        "iceconnectionstatechange",
        iceConnectionStateChange
      );

      peerConnection.removeEventListener(
        "icecandidateerror",
        iceCandidateError
      );

      peerConnection.removeEventListener("icecandidate", iceCandidate);

      peerConnection.removeEventListener(
        "negotiationneeded",
        negotiationNeeded
      );
    };
  }, [peerConnection]);

  // Returns a promise that resolves when the |transport.state| is |state|
  // This should work for RTCSctpTransport, RTCDtlsTransport and RTCIceTransport.
  async function waitForState(
    transport: RTCSctpTransport | RTCDtlsTransport | RTCIceTransport,
    state: RTCSctpTransportState | RTCDtlsTransportState | RTCIceTransportState
  ) {
    while (transport.state != state) {
      await waitUntilEvent(transport, "statechange");
    }
  }

  // Returns a promise that resolves when |pc.iceConnectionState| is 'connected'
  // or 'completed'.
  async function listenToIceConnected(pc: RTCPeerConnection) {
    await waitForIceStateChange(pc, ["connected", "completed"]);
  }

  // Returns a promise that resolves when |pc.iceConnectionState| is in one of the
  // wanted states.
  async function waitForIceStateChange(
    pc: RTCPeerConnection,
    wantedStates: RTCIceConnectionState[]
  ) {
    while (!wantedStates.includes(pc.iceConnectionState)) {
      await waitUntilEvent(pc, "iceconnectionstatechange");
    }
  }

  // Returns a promise that resolves when |pc.connectionState| is 'connected'.
  async function listenToConnected(pc: RTCPeerConnection) {
    while (pc.connectionState != "connected") {
      await waitUntilEvent(pc, "connectionstatechange");
    }
  }

  // Returns a promise that resolves when |pc.connectionState| is in one of the
  // wanted states.
  async function waitForConnectionStateChange(
    pc: RTCPeerConnection,
    wantedStates: RTCPeerConnectionState[]
  ) {
    while (!wantedStates.includes(pc.connectionState)) {
      await waitUntilEvent(pc, "connectionstatechange");
    }
  }

  async function waitForIceGatheringState(
    pc: RTCPeerConnection,
    wantedStates: RTCIceGatheringState[]
  ) {
    while (!wantedStates.includes(pc.iceGatheringState)) {
      await waitUntilEvent(pc, "icegatheringstatechange");
    }
  }

  function waitUntilEvent(obj: any, name: string) {
    return new Promise((r) => obj.addEventListener(name, r, { once: true }));
  }

  return {
    peerConnection,
    waitForState,
    listenToIceConnected,
    listenToConnected,
    waitForConnectionStateChange,
    waitForIceGatheringState,
    iceGatheringState,
    connectionState,
    signalingState,
    dataChannel,
    iceConnectionState,
  };
}
