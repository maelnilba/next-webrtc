import { useEffect, useState } from "react";

type StreamConfig = { config: MediaStreamConstraints };
export function useLocaleStream(props: StreamConfig) {
  const [localeStream, setLocaleStream] = useState<MediaStream>();
  useEffect(() => {
    if (localeStream) return;
    navigator.mediaDevices.getUserMedia(props.config).then((stream) => {
      setLocaleStream(stream);
    });
  }, []);

  return localeStream;
}
