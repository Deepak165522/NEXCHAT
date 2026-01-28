import React, { useEffect, useRef, useCallback } from "react";

import {
  FaPhone,
  FaPhoneSlash,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import useAudioCallStore from "../../store/audioCallStore";
import useUserStore from "../../store/useUserStore"; // ✅ ADD THIS
import useCallHistoryStore from "../../store/useCallHistoryStore";



const AudioCallModal = ({ socket }) => {
 
  const localAudioRef = useRef(null);

  const { user } = useUserStore(); // ✅ ADD THIS
 
  const {
    incomingCall,
    currentCall,
    callStatus,
    isMuted,
    isModalOpen,
    localStream,
    peerConnection,
    setLocalStream,
    setPeerConnection,
    setCallStatus,
    setCurrentCall,
    toggleMute,
    endCall,
     callDuration,        // 🔥 ADD
 setCallDuration,

 setCallMinimized,

  isCallMinimized,

    
    
  } = useAudioCallStore();

 
// const [callDuration, setCallDuration] = React.useState(0);


  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  /* 🎧 INIT AUDIO */
  const initAudio = useCallback(async () => {
  if (localStream) return localStream;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  setLocalStream(stream);

  if (localAudioRef.current) {
    localAudioRef.current.srcObject = stream;
  }

  return stream;
}, [localStream, setLocalStream]);


  /* 🔗 PEER */
  const createPC = useCallback(
  (stream) => {
    if (peerConnection) return peerConnection;

    const pc = new RTCPeerConnection(rtcConfig);

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play();
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && currentCall) {
        socket.emit("webrtc_ice_candidate", {
          candidate: e.candidate,
          receiverId: currentCall.participantId,
          callId: currentCall.callId,
        });
      }
    };

    setPeerConnection(pc);
    return pc;
  },
  [peerConnection, currentCall, socket, setPeerConnection]
);




const handleEndCall = () => {
  const store = useAudioCallStore.getState();

  console.log("STORE SNAPSHOT:", store);

  const callId =
    store.activeCallId ||
    store.currentCall?.callId ||
    store.incomingCall?.callId;

  console.log("❌ END CALL CLICKED (fallback):", callId);

  if (!callId) return;


  // ✅ ADD HISTORY HERE
  useCallHistoryStore.getState().addCall({
    id: Date.now(),
    name:
      store.currentCall?.participantName ||
      store.incomingCall?.callerName,
    avatar:
      store.currentCall?.participantAvatar ||
      store.incomingCall?.callerAvatar,
    type: "audio",
    direction: store.currentCall ? "outgoing" : "incoming",
    missed: store.callStatus !== "connected",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  socket.emit("terminate_call", {
    callId,
    type: "end",
  });
};











const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};




  /* ✅ ACCEPT (RECEIVER) */
  const acceptCall = async () => {
    setCallStatus("connected");

    

    setCurrentCall({
      callId: incomingCall.callId,
      participantId: incomingCall.callerId,
      participantName: incomingCall.callerName,
    });

    const stream = await initAudio();
    createPC(stream);

    socket.emit("accept_audio_call", {
      callerId: incomingCall.callerId,
      callId: incomingCall.callId,
    });
  };



  useEffect(() => {
  let timer;

  if (callStatus === "connected") {
    timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }

  return () => {
    if (timer) clearInterval(timer);
  };
}, [callStatus]);



  /* 🔌 SOCKET FLOW */
  useEffect(() => {
    if (!socket) return;

    // 🔥 CALLER ONLY → CREATE OFFER
    socket.on("call_accepted", async ({ callId }) => {
  if (!currentCall) return;
if (peerConnection) return;
  // 🔥🔥🔥 THIS IS THE MISSING LINE
  setCallStatus("connected");

  const stream = await initAudio();
  const pc = createPC(stream);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("webrtc_offer", {
    offer,
    receiverId: currentCall.participantId,
    callId,
  });
});


    // 🔥 RECEIVER → ANSWER
    socket.on("webrtc_offer", async ({ offer, senderId }) => {
      const stream = await initAudio();
      const pc = createPC(stream);

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc_answer", {
        answer,
        receiverId: senderId,
      });
    });

   socket.on("webrtc_answer", async ({ answer }) => {
  if (!peerConnection) return;

  // 🔥 IMPORTANT GUARD
  if (peerConnection.signalingState !== "have-local-offer") {
    console.warn(
      "Ignoring answer, wrong state:",
      peerConnection.signalingState
    );
    return;
  }

  await peerConnection.setRemoteDescription(answer);
});


    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(candidate);
      }
    });

    return () => {
  socket.off("call_accepted");
  socket.off("webrtc_offer");
  socket.off("webrtc_answer");
  socket.off("webrtc_ice_candidate");
};

  }, [socket, currentCall, peerConnection, initAudio, createPC]);


if (!isModalOpen || isCallMinimized) return null;


  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div
      className="
        w-full max-w-sm
        rounded-2xl
        px-6 py-7
        text-center
        shadow-2xl
        bg-[#202c33] text-white
        dark:bg-[#202c33]
        light:bg-white light:text-black
      "
    >
        <h2 className="text-xl font-semibold tracking-wide mb-1">
        {incomingCall?.callerName || currentCall?.participantName}
      </h2>

      {/* 📞 STATUS / TIMER */}
      <p className="text-sm opacity-70 mb-6 font-medium">
        {incomingCall && callStatus === "ringing" && "Incoming voice call"}
        {!incomingCall && callStatus === "calling" && "Calling…"}
        {!incomingCall && callStatus === "ringing" && "Ringing…"}
        {callStatus === "connected" && (
          <span className="font-mono tracking-wider">
            {formatDuration(callDuration)}
          </span>
        )}
      </p>



        <audio ref={localAudioRef} autoPlay muted />

         <div className="flex justify-center items-center gap-8 mt-2">




            
          {incomingCall && callStatus === "ringing" ? (
            <>
              {/* ✅ ACCEPT */}
              <button
              onClick={acceptCall}
              className="
                w-14 h-14
                flex items-center justify-center
                rounded-full
                bg-green-500 hover:bg-green-600
                shadow-lg
                transition
              "
            >
              <FaPhone size={18} />
            </button>

              {/* ❌ REJECT */}
              <button
              onClick={() => {
                socket.emit("terminate_call", {
                  callId: incomingCall.callId,
                  type: "reject",
                });
                endCall();
              }}
              className="
                w-14 h-14
                flex items-center justify-center
                rounded-full
                bg-red-500 hover:bg-red-600
                shadow-lg
                transition
              "
            >
              <FaPhoneSlash size={18} />
            </button>
          </>
          ) : (
            <>
               <button
              onClick={toggleMute}
              className="
                w-12 h-12
                flex items-center justify-center
                rounded-full
                bg-white/10 hover:bg-white/20
                transition
              "
            >
                {isMuted ? (
                <FaMicrophoneSlash size={16} />
              ) : (
                <FaMicrophone size={16} />
              )}
            </button>

             <button
              onClick={handleEndCall}
              className="
                w-14 h-14
                flex items-center justify-center
                rounded-full
                bg-red-500 hover:bg-red-600
                shadow-lg
                transition
              "
            >
              <FaPhoneSlash size={18} />
            </button>

            <button
  onClick={() => setCallMinimized(true)}
  className="bg-white/10 px-3 py-2 rounded-lg text-sm"
>
  Minimize
</button>

          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioCallModal;
