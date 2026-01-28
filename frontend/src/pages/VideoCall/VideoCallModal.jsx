import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import {FaMicrophone, FaPhoneSlash, FaTimes, FaVideo, FaVideoSlash } from "react-icons/fa";
import useCallHistoryStore from "../../store/useCallHistoryStore";



const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    peerConnection,
    iceCandidatesQueue,
    isCallModalOpen,
    callStatus,
    setIncomingCall,
    isAudioEnabled,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    resetCallState,
    setCallStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
   addIceCandidateToQueue,

    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const { callDuration } = useVideoCallStore();

  


  const formatDuration = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};


  

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.1.google.com:19302" },
      { urls: "stun:stun.1.google.com:19302" },
      { urls: "stun:stun.1.google.com:19302" },
    ],
  };

  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected");
      setCallActive(true);

      useVideoCallStore.getState().startCallTimer();
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);


  useEffect(() => {
  if (callStatus !== "connected") return;

  const interval = setInterval(() => {
    useVideoCallStore.getState().updateCallDuration();
  }, 1000);

  return () => clearInterval(interval);
}, [callStatus]);


  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // const initializeMedia = async (video = true) => {
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: video ? { width: 640, height: 480 } : false,
  //     audio: true,
  //   });
  //   setLocalStream(stream);
  //   return stream;
  // };

useEffect(() => {
  return () => {
    // 🔥 component destroy → camera force off
    stopAllVideoMedia();
  };
}, []);


const stopAllVideoMedia = () => {
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop(); // 🎥 CAMERA + 🎤 MIC OFF
    });
  }

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = null;
  }

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }

  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.close();
  }

  // 🔥 IMPORTANT — Zustand cleanup
  setLocalStream(null);
  setRemoteStream(null);
  setPeerConnection(null);
};



  const initializeMedia=async (video=true) => {
    try {
      const stream=await navigator.mediaDevices.getUserMedia({
        video: video ? {width:640,height:480} : false,
        audio:true,
      })
      console.log("Local media stream", stream.getTracks())
      setLocalStream(stream)
      return stream;
      
    } catch (error) {
      console.error("Media error",error)
      throw error;
    }
  }

  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0,8))
        pc.addTrack(track, stream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId:callId
          });
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream=new  MediaStream([event.track]);
        setRemoteStream(stream)
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`role ${role} : connection state`, pc.connectionState)
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`${role}: ICE state`, pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`${role}: Signaling state`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia(callType === "video");
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("Caller Error", error)
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

 const handleAnswerCall = async () => {
   useVideoCallStore.getState().stopIncomingTone();
  try {
    setCallStatus("connecting");

    const stream = await initializeMedia(callType === "video");

    const pc = createPeerConnection(stream, "RECEIVER");

    // 🔥 IMPORTANT (YE LINE MISS THI)
    setPeerConnection(pc);

    socket.emit("accept_call", {
      callerId: incomingCall?.callerId,
      callId: incomingCall?.callId,
      receiverInfo: {
        username: user?.username,
        profilePicture: user?.profilePicture,
      },
    });

    setCurrentCall({
      callId: incomingCall?.callId,
      participantId: incomingCall?.callerId,
      participantName: incomingCall?.callerName,
      participantAvatar: incomingCall?.callerAvatar,
    });

    clearIncomingCall();
  } catch (error) {
    console.error("Receiver Error:", error);
    handleEndCall();
  }
};


  const handleRejectCall = () => {

     useVideoCallStore.getState().stopIncomingTone();
    if(incomingCall) {
    socket.emit("reject_call", {
      callerId: incomingCall?.callerId,
      callId: incomingCall?.callId,
    });
  }
    endCall();
    resetCallState();
  };

  const handleEndCall = () => {
     useVideoCallStore.getState().stopIncomingTone();

     // ✅ ADD HISTORY HERE
  useCallHistoryStore.getState().addCall({
    id: Date.now(),
    name: displayInfo?.name,
    avatar: displayInfo?.avatar,
    type: "video",
    direction: currentCall ? "outgoing" : "incoming",
    missed: callStatus !== "connected",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  const participantId =
    currentCall?.participantId || incomingCall?.callerId;
  const callId = currentCall?.callId || incomingCall?.callId;

  if (participantId && callId) {
    socket.emit("end_call", {
      callId,
      participantId,
      duration: callDuration,
    });
  }

  stopAllVideoMedia();   // 🔥🔥🔥
  resetCallState();
};


  useEffect(() => {
  if (incomingCall && !isCallActive) {
    useVideoCallStore.getState().playIncomingTone();
  }
}, [incomingCall, isCallActive]);



  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = ({receiverName}) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500)
      }
    };

    const handleCallRejected =  () => {
  setCallStatus("rejected");

  // 🔥 IMMEDIATELY close modal state
  endCall();
  resetCallState();
};


   const handleCallEnded = () => {
     useVideoCallStore.getState().stopIncomingTone();
  endCall();          // mic, camera, peer connection close
  resetCallState();   // 🔥 modal band + chat screen open
};


   const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
  try {
    let pc = peerConnection;

    // 🔥 OFFER aaya aur pc nahi tha → bana do
    if (!pc) {
      const stream =
        localStream || (await initializeMedia(callType === "video"));
      pc = createPeerConnection(stream, "RECEIVER");
      setPeerConnection(pc);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await processQueuedIceCandidates();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("webrtc_answer", {
      answer,
      receiverId: senderId,
      callId,
    });

    console.log("Receiver: Answer sent");
  } catch (error) {
    console.error("Receiver offer error", error);
  }
};




    const handleWebRTCAnswer=async ({answer,senderId,callId}) => {
      if(!peerConnection) return;

      if(peerConnection.signalingState === 'close') {
        console.log("Caller : Peer connection is closed")
        return;
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        await processQueuedIceCandidates();

        const receivers = peerConnection.getReceivers();

        console.log('Receiver', receivers)
      } catch (error) {
        console.error("caller answer error", error)
      }
    }


const handleWebRTCIceCandidates = async ({candidate, senderId}) => {
  if(peerConnection && peerConnection.signalingState !== "closed"){
    if(peerConnection.remoteDescription){
      try{
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added")
        
      }catch (error) {
        console.log('ICE candiate error', error);
        
      }
    }else{
      console.log("queuing ice candidates")
      addIceCandidateToQueue(candidate)
      
    }
  }
}



    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    console.log("socket listerners registers")

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (!isCallModalOpen && !incomingCall) return null;

  const shouldShowActiveCall=isCallActive || callStatus === "calling" || callStatus ==="connecting"


  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center 
bg-black/80 backdrop-blur-sm">

        <div
  className={`relative w-full h-full sm:max-w-4xl sm:h-[90vh]
  rounded-none sm:rounded-2xl overflow-hidden
  ${theme === "dark"
  ? "bg-[#0b141a]"
  : "bg-gradient-to-b from-gray-200 to-gray-300"}
`}
>


    {incomingCall && !isCallActive && (
  <div
    className={`flex flex-col items-center justify-center h-full gap-6
    ${theme === "dark" ? "bg-[#0b141a]" : "bg-[#f0f2f5]"}`}
  >
    {/* Avatar */}
    <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-white/20">
      <img
        src={displayInfo?.avatar}
        alt={displayInfo?.name}
        className="w-full h-full object-cover"
        onError={(e) => (e.target.src = "/placeholder.svg")}
      />
    </div>

    {/* Name */}
    <h2
      className={`text-2xl font-semibold ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      {displayInfo?.name}
    </h2>

    {/* Subtitle */}
    <p
      className={`text-sm tracking-wide ${
        theme === "dark" ? "text-gray-300" : "text-gray-600"
      }`}
    >
      Incoming {callType === "video" ? "video" : "voice"} call
    </p>

    {/* Buttons */}
    <div className="flex items-center gap-12 mt-8">
      {/* Reject */}
      <button
        onClick={handleRejectCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600
        flex items-center justify-center text-white shadow-xl transition"
      >
        <FaPhoneSlash size={22} />
      </button>

      {/* Accept */}
      <button
        onClick={handleAnswerCall}
        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600
        flex items-center justify-center text-white shadow-xl transition"
      >
        <FaVideo size={22} />
      </button>
    </div>
  </div>
)}



{shouldShowActiveCall && (
  <div
    className={`relative w-full h-full overflow-hidden
    ${theme === "dark" ? "bg-black" : "bg-[#f0f2f5]"}`}
  >
    {/* REMOTE VIDEO */}
    {callType === "video" && (
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover
        ${remoteStream ? "opacity-100" : "opacity-0"}`}
      />
    )}

    {/* FALLBACK AVATAR (Voice / No video yet) */}
    {(!remoteStream || callType !== "video") && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div
  className={`w-28 h-28 rounded-full overflow-hidden shadow-xl
  ${theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`}
>

          <img
            src={displayInfo?.avatar}
            alt={displayInfo?.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = "/placeholder.svg")}
          />
        </div>

        <p
  className={`text-lg font-medium ${
    theme === "dark" ? "text-white" : "text-gray-800"
  }`}
>

          {callStatus === "calling"
            ? `Calling ${displayInfo?.name}…`
            : callStatus === "connecting"
            ? "Connecting…"
            : callStatus === "connected"
            ? displayInfo?.name
            : "Call ended"}
        </p>
      </div>
    )}

    {/* LOCAL VIDEO – Picture in Picture */}
    {callType === "video" && localStream && (
      <div
  className={`absolute top-4 right-4
    w-32 h-44 sm:w-40 sm:h-52
    rounded-xl overflow-hidden
    shadow-xl
    border-2
    ${theme === "dark"
      ? "border-white bg-black"
      : "border-gray-800 bg-gray-200"}
  `}
>

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    )}

    {/* STATUS / TIMER */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2">
      <div
        className={`px-4 py-1.5 rounded-full text-sm font-medium
        ${theme === "dark"
  ? "bg-black/60 text-white"
  : "bg-gray-900 text-white"}
`}
      >
        {callStatus === "connected"
          ? formatDuration(callDuration)
          : callStatus}
      </div>
    </div>

    {/* CONTROLS */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-6">
        {/* VIDEO */}
        {callType === "video" && (
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center
${
  isVideoEnabled
    ? theme === "dark"
      ? "bg-gray-700 text-white"
      : "bg-gray-800 text-white"
    : "bg-red-500 text-white"
}`}

          >
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>
        )}

        {/* AUDIO */}
        <button
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center
${
  isAudioEnabled
    ? theme === "dark"
      ? "bg-gray-700 text-white"
      : "bg-gray-800 text-white"
    : "bg-red-500 text-white"
}`}

        >
          <FaMicrophone />
        </button>

        {/* END */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600
          flex items-center justify-center text-white shadow-xl"
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  </div>
)}



{/* {callStatus === "calling" && (
  <button
    onClick={handleEndCall}
    className="
      absolute top-4 right-4
      w-10 h-10
      rounded-full
      bg-black/50 hover:bg-black/70
      backdrop-blur-md
      flex items-center justify-center
      text-white
      transition-all duration-200
      shadow-lg
    "
  >
    <FaTimes className="w-4 h-4" />
  </button>
)} */}



        </div>


    </div>
  )
};

export default VideoCallModal;


