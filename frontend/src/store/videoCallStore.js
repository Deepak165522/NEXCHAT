import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";




const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    // call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null,

    callDuration: 0,
callStartTime: null,







    // media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // WebRTC state
    peerConnection: null,
    iceCandidatesQueue: [],

    isCallModalOpen: false,
    callStatus: "idle",

    setCurrentCall: (call) => {
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },

    setCallActive: (active) => {
      set({ isCallActive: active });
    },


   // 🔊 RINGTONE INSTANCE (OUTSIDE STATE)




playIncomingTone: () => {
  const audio = window.__CALL_AUDIO__;

  if (!audio) {
    console.log("⛔ Audio not unlocked yet");
    return;
  }

  audio.currentTime = 0;
  audio.loop = true;

  audio.play()
    .then(() => console.log("📞 Video ringtone playing"))
    .catch(err => console.log("❌ play failed", err));
},

stopIncomingTone: () => {
  const audio = window.__CALL_AUDIO__;
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  console.log("🔕 Video ringtone stopped");
},




    setCallType: (type) => {
      set({ callType: type });
    },

    setLocalStream: (stream) => {
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },

    setPeerConnection: (pc) => set({ peerConnection: pc }),
    setCallModalOpen: (open) => set({ isCallModalOpen: open }),
    setCallStatus: (status) => set({ callStatus: status }),

    addIceCandidateToQueue: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({
        iceCandidatesQueue: [...iceCandidatesQueue, candidate],
      });
    },

    processQueuedIceCandidates: async () => {
      const { peerConnection, iceCandidatesQueue } = get();

      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        for (const candidate of iceCandidatesQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (error) {
            console.log("ICE candidate error", error);
          }
        }

        set({ iceCandidatesQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();

      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },


// 🔥 START TIMER
startCallTimer: () => {
  set({
    callStartTime: Date.now(),
    callDuration: 0,
  });
},

// 🔥 UPDATE TIMER (har second)
updateCallDuration: () => {
  const { callStartTime } = get();
  if (!callStartTime) return;

  const seconds = Math.floor((Date.now() - callStartTime) / 1000);
  set({ callDuration: seconds });
},



    endCall: () => {
      const { localStream, peerConnection } = get();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }
    },

    // ✅ SAME set(...) — sirf function ke andar dala
    resetCallState: () => {
      set({
        currentCall: null,
        incomingCall: null,

         isCallActive: false,
    callType: null,

        localStream: null,
        remoteStream: null,

        isVideoEnabled: true,
        isAudioEnabled: true,

        peerConnection: null,
        iceCandidatesQueue: [],

        isCallModalOpen: false,
        callStatus: "idle",


       


// 🔥 ADD THESE
    callDuration: 0,
    callStartTime: null,

      });
    },

    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
  }))
);

export default useVideoCallStore;
