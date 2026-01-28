import { useEffect, useState } from "react";

export const useAudioTimer = (startTime) => {
  const [time, setTime] = useState("00:00");

  useEffect(() => {
    if (!startTime) return;

    const i = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setTime(`${m}:${s}`);
    }, 1000);

    return () => clearInterval(i);
  }, [startTime]);

  return time;
};
export default useAudioTimer;