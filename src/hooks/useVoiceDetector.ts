import { useEffect, useRef } from "react";
import vad from "voice-activity-detection";

export function useVoiceDetector() {
  const voiceDetector = useRef<any | null>(null);
  const audioContext = useRef<any | null>(null);
  async function requestMic() {
    try {
      window.AudioContext = window.AudioContext;
      audioContext.current = new AudioContext();

      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream: MediaStream) => {
          startUserMedia(stream);
        })
        .catch((reason) => {
          handleMicConnectError(reason);
        });
    } catch (e) {
      handleUserMediaError();
    }
  }

  function handleUserMediaError() {
    console.warn("Mic input is not supported by the browser.");
  }

  function handleMicConnectError(r: any) {
    console.warn(
      "Could not connect microphone. Possible rejected by the user or is blocked by the browser.",
      r
    );
  }

  function startUserMedia(stream: any) {
    var options = {
      onVoiceStart: function () {
        console.log("voice start");
        console.log("Voice state: <strong>active</strong>");
      },
      onVoiceStop: function () {
        console.log("voice stop");
        console.log("Voice state: <strong>inactive</strong>");
      },
      onUpdate: function (val: any) {
        //console.log('curr val:', val);
        console.log(
          "Current voice activity value: <strong>' + val + '</strong>"
        );
      },
    };
    vad(audioContext.current, stream, options);
  }
  useEffect(() => {
    requestMic();
  }, []);
}
