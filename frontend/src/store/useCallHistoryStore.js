import { create } from "zustand";

const useCallHistoryStore = create((set) => ({
  calls: [],

  addCall: (call) =>
    set((state) => ({
      calls: [call, ...state.calls], // latest on top
    })),

  clearCalls: () => set({ calls: [] }),
}));

export default useCallHistoryStore;
