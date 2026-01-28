import React, { useCallback, useEffect } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import VideoCallModal from "./VideoCallModal";


const VideoCallManager = ({ socket }) => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallModalOpen,
    setCallStatus,
    setCallType,
    endCall,
  } = useVideoCallStore();

  const { user } = useUserStore();

  useEffect(() => {
    if (!socket) return;

    // Handle incoming call
    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callId,
      callType
    }) => {


 if (callType !== "video") return;

      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId
      });

      setCallType(callType);
      setCallStatus("ringing");
      setCallModalOpen(true);
    };

    const handleCallEnded = ({ reason }) => {
      setCallStatus("failed");

      setTimeout(() => {
        endCall();
      }, 2000);
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_failed", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_failed", handleCallEnded);
    };
  }, [
    socket,
    endCall,
    setIncomingCall,
    setCallModalOpen,
    setCallStatus,
    setCallType,
  ]);

  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${user?._id}-${receiverId}-${Date.now()}`;

      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      };

      setCurrentCall(callData);
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("calling");

      // Emit the call initiate
      socket.emit("initiate_call", {
        callerId: user?._id,
        receiverId,
        callType,
        callerInfo: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
      });
    },
    [
      user,
      socket,
      setCurrentCall,
      setCallType,
      setCallModalOpen,
      setCallStatus,
    ]
  );

  useEffect(() =>{
    useVideoCallStore.getState().initiateCall=initiateCall
  },[initiateCall])

  return <VideoCallModal socket={socket} />;
};

export default VideoCallManager;
