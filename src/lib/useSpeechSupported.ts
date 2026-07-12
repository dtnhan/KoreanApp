"use client";

import { useSyncExternalStore } from "react";
import { isSpeechSupported } from "@/lib/speech";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

/**
 * SSR-safe: server/hydration trả về false, client trả về khả năng thật.
 * Dùng useSyncExternalStore thay cho setState-trong-effect.
 */
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(subscribe, isSpeechSupported, getServerSnapshot);
}
