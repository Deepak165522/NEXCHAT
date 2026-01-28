import { create } from "zustand";

const useAudioCallStore = create((set, get) => ({
  currentCall: null,
  incomingCall: null,
  callStatus: "idle", // idle | calling | ringing | connected
  isModalOpen: false,

  localStream: null,
  peerConnection: null,
  isMuted: false,

isCallMinimized: false,

setCallMinimized: (v) => set({ isCallMinimized: v }),


  // 🔥 ADD THESE TWO LINES
  callDuration: 0,
  setCallDuration: (updater) =>
    set((state) => ({
      callDuration:
        typeof updater === "function"
          ? updater(state.callDuration)
          : updater,
    })),

  /* 📞 CALL START (CALLER) */
initiateAudioCall: ({ user, receiver, socket }) => {
  set({
    callStatus: "ringing",
    isModalOpen: true,
    currentCall: {
      participantId: receiver._id,
      participantName: receiver.username,
    },
  });

  socket.emit("initiate_audio_call", {
    callerId: user._id,
    receiverId: receiver._id,
    callerInfo: {
      username: user.username,
      profilePicture: user.profilePicture,
    },
  });
},




  /* 📥 RECEIVER */
  setIncomingCall: (data) =>
    set({
      incomingCall: data,
      callStatus: "ringing",
      isModalOpen: true,
    }),

  setCurrentCall: (call) => set({ currentCall: call }),
  setCallStatus: (status) => set({ callStatus: status }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  toggleMute: () =>
    set((state) => {
      state.localStream?.getAudioTracks().forEach(
        (t) => (t.enabled = !t.enabled)
      );
      return { isMuted: !state.isMuted };
    }),

  endCall: () =>
    set((state) => {
      state.localStream?.getTracks().forEach((t) => t.stop());
      state.peerConnection?.close();

      return {
        currentCall: null,
        incomingCall: null,
        activeCallId: null, // 🔥 IMPORTANT
        callStatus: "idle",
        isModalOpen: false,
        localStream: null,
        peerConnection: null,
        isMuted: false,
        callDuration: 0,
      };
    }),
}));

export default useAudioCallStore;
