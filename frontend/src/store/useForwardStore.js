import { create } from "zustand";

export const useForwardStore = create((set) => ({
  forwardMessage: null,
  isOpen: false,

  openForward: (message) =>
    set({ forwardMessage: message, isOpen: true }),

  closeForward: () =>
  set({
    forwardMessage: null,
    isOpen: false,
  }),

}));
