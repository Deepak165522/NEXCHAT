import { useEffect, useRef } from "react";
import useAudioCallStore from "../../store/audioCallStore";

const AudioCallManager = ({ socket }) => {
  const { setIncomingCall, endCall, setCallStatus } = useAudioCallStore();
const ringtoneRef = useRef(null);


useEffect(() => {
  if (!socket) return;

  socket.on("call_started", ({ callId }) => {
    console.log("📞 Call started, id:", callId);
    useAudioCallStore.setState({ activeCallId: callId });
  });

  return () => {
    socket.off("call_started");
  };
}, [socket]);


useEffect(() => {
    const audio = ringtoneRef.current;
    if (!audio) return;

    const { callStatus } = useAudioCallStore.getState();

    if (callStatus === "ringing") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [useAudioCallStore((s) => s.callStatus)]);



  useEffect(() => {
    if (!socket) return;

    /* 📞 RECEIVER GETS CALL */
    const onIncomingCall = (data) => {
      if (data.callType !== "audio") return;

      console.log("📞 Incoming audio call:", data);
      setIncomingCall(data);
      setCallStatus("ringing");
      // 🔥 ADD THIS
  useAudioCallStore.getState().setCallDuration(0);

  
      
    };

    /* 🔴 CLOSE CALL — BOTH SIDES */
    const onCallEnded = ({ reason }) => {
      console.log("📴 Call ended:", reason);

      if (ringtoneRef.current) {
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

      setCallStatus("idle");
      endCall(); // 🔥 closes modal for BOTH users
    };

    /* ❌ FAILED (offline / blocked) */
    const onCallFailed = () => {

      if (ringtoneRef.current) {
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }
      setCallStatus("idle");
      endCall();
    };

    socket.on("incoming_call", onIncomingCall);
    socket.on("call_ended", onCallEnded);
    socket.on("call_failed", onCallFailed);

    return () => {
      socket.off("incoming_call", onIncomingCall);
      socket.off("call_ended", onCallEnded);
      socket.off("call_failed", onCallFailed);
    };
  }, [socket, setIncomingCall, endCall, setCallStatus]);




  return (
    <audio
      ref={ringtoneRef}
      src="/incoming-call.mp3"
      loop
      preload="auto"
    />
  );
};


export default AudioCallManager;
