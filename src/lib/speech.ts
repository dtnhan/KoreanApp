// Lõi phát âm tiếng Hàn: Web Speech API + registry "đang phát" dùng chung.
// Chỉ gọi các hàm có side effect từ event handler / useEffect (client).

export type MinimalVoice = {
  lang: string;
  localService: boolean;
  name: string;
};

/** Chuẩn hóa mã ngôn ngữ: "ko_KR" → "ko-kr". */
function normalizeLang(lang: string): string {
  return lang.replace(/_/g, "-").toLowerCase();
}

/**
 * Chọn giọng tiếng Hàn tốt nhất (pure, test được):
 * ưu tiên ko-KR local > ko-KR bất kỳ > bất kỳ giọng ko* nào; null nếu không có.
 */
export function pickKoreanVoice<T extends MinimalVoice>(voices: T[]): T | null {
  let koKr: T | null = null;
  let koAny: T | null = null;
  for (const v of voices) {
    const lang = normalizeLang(v.lang);
    if (lang === "ko-kr") {
      if (v.localService) return v; // tốt nhất, dừng luôn
      if (!koKr) koKr = v;
    } else if (lang.startsWith("ko") && !koAny) {
      koAny = v;
    }
  }
  return koKr ?? koAny;
}

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

// ---------- Registry toàn cục: mỗi lúc chỉ một nguồn âm thanh ----------

type StopFn = () => void;
let currentStop: StopFn | null = null;

/** Đăng ký nguồn phát mới — tự dừng nguồn đang phát trước đó. */
export function claimPlayback(stop: StopFn): void {
  if (currentStop && currentStop !== stop) {
    const prev = currentStop;
    currentStop = null;
    prev();
  }
  currentStop = stop;
}

/** Gỡ đăng ký (khi phát xong hoặc bị dừng). */
export function releasePlayback(stop: StopFn): void {
  if (currentStop === stop) currentStop = null;
}

// ---------- Nạp giọng Hàn (quirk voiceschanged của Chrome/Safari) ----------

let voicePromise: Promise<SpeechSynthesisVoice | null> | null = null;

export function loadKoreanVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!isSpeechSupported()) return Promise.resolve(null);
  if (voicePromise) return voicePromise;

  voicePromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(pickKoreanVoice(existing));
      return;
    }
    // Chrome nạp voice bất đồng bộ; Safari đôi khi không bắn voiceschanged → timeout 2s
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener?.("voiceschanged", finish);
      resolve(pickKoreanVoice(synth.getVoices()));
    };
    synth.addEventListener?.("voiceschanged", finish);
    setTimeout(finish, 2000);
  });
  return voicePromise;
}

// ---------- Phát TTS ----------

export type SpeakOptions = {
  rate?: number;
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Phát một đoạn tiếng Hàn. Hủy phát trước đó, tạo utterance MỚI mỗi lần
 * (quirk Chrome: reuse utterance gây im lặng). Trả về hàm hủy.
 */
export function speakKorean(text: string, opts: SpeakOptions = {}): StopFn {
  if (!isSpeechSupported()) {
    opts.onError?.();
    return () => {};
  }

  const synth = window.speechSynthesis;
  let cancelled = false;

  const cancel: StopFn = () => {
    if (cancelled) return;
    cancelled = true;
    releasePlayback(cancel);
    synth.cancel();
  };

  claimPlayback(cancel);

  loadKoreanVoice().then((voice) => {
    if (cancelled) return;
    synth.cancel(); // quirk: cancel ngay trước speak để tránh hàng đợi kẹt
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR"; // luôn set, kể cả khi không tìm được voice
    if (voice) utterance.voice = voice;
    if (opts.rate) utterance.rate = opts.rate;
    utterance.onend = () => {
      releasePlayback(cancel);
      if (!cancelled) opts.onEnd?.();
    };
    utterance.onerror = (e) => {
      releasePlayback(cancel);
      // "canceled"/"interrupted" là do chính ta cancel — không coi là lỗi
      if (!cancelled && e.error !== "canceled" && e.error !== "interrupted") {
        opts.onError?.();
      }
    };
    synth.speak(utterance);
  });

  return cancel;
}

export type PlayKoreanOptions = SpeakOptions & { audioUrl?: string | null };

/**
 * Phát một đoạn tiếng Hàn: ưu tiên file MP3 nếu có `audioUrl` (và không đổi tốc độ),
 * lỗi file thì fallback sang TTS. Nếu có `rate` (đọc chậm) hoặc không có file → dùng TTS.
 * Trả về hàm hủy; tích hợp registry "chỉ một nguồn phát".
 */
export function playKorean(text: string, opts: PlayKoreanOptions = {}): StopFn {
  const { audioUrl, rate, onEnd, onError } = opts;

  // Đọc chậm chỉ TTS làm được; không có file → TTS
  if (!audioUrl || (rate && rate !== 1)) {
    return speakKorean(text, { rate, onEnd, onError });
  }

  if (typeof Audio === "undefined") {
    return speakKorean(text, { onEnd, onError });
  }

  let cancelled = false;
  let fellBack = false;
  const audio = new Audio(audioUrl);

  const cancel: StopFn = () => {
    if (cancelled) return;
    cancelled = true;
    releasePlayback(cancel);
    audio.pause();
  };

  audio.onended = () => {
    releasePlayback(cancel);
    if (!cancelled) onEnd?.();
  };
  audio.onerror = () => {
    releasePlayback(cancel);
    if (cancelled || fellBack) return;
    fellBack = true;
    // File hỏng → fallback TTS (speakKorean tự claim registry)
    speakKorean(text, { onEnd, onError });
  };

  claimPlayback(cancel);
  void audio.play().catch(() => {
    if (!cancelled && !fellBack) {
      fellBack = true;
      releasePlayback(cancel);
      speakKorean(text, { onEnd, onError });
    }
  });

  return cancel;
}
