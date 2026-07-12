import { describe, it, expect } from "vitest";
import {
  pickKoreanVoice,
  isSpeechSupported,
  claimPlayback,
  releasePlayback,
  type MinimalVoice,
} from "./speech";

function v(lang: string, localService = false, name = lang): MinimalVoice {
  return { lang, localService, name };
}

describe("pickKoreanVoice", () => {
  it("trả về null khi không có giọng nào", () => {
    expect(pickKoreanVoice([])).toBeNull();
  });

  it("trả về null khi chỉ có giọng ngôn ngữ khác", () => {
    expect(pickKoreanVoice([v("en-US"), v("vi-VN"), v("ja-JP")])).toBeNull();
  });

  it("ưu tiên ko-KR localService hơn ko-KR thường", () => {
    const local = v("ko-KR", true, "Local KO");
    const remote = v("ko-KR", false, "Remote KO");
    expect(pickKoreanVoice([remote, local])).toBe(local);
  });

  it("chọn ko-KR đầu tiên khi không có localService", () => {
    const first = v("ko-KR", false, "First");
    const second = v("ko-KR", false, "Second");
    expect(pickKoreanVoice([v("en-US"), first, second])).toBe(first);
  });

  it("chuẩn hóa ko_KR (gạch dưới) và chữ hoa/thường", () => {
    const weird = v("ko_kr", false, "Android style");
    expect(pickKoreanVoice([v("en_US"), weird])).toBe(weird);
  });

  it("fallback sang giọng ko* bất kỳ khi không có ko-KR", () => {
    const ko = v("ko", false, "Plain ko");
    expect(pickKoreanVoice([v("en-US"), ko])).toBe(ko);
  });

  it("ko-KR thắng giọng ko chung chung", () => {
    const koKr = v("ko-KR", false, "KO-KR");
    expect(pickKoreanVoice([v("ko", false, "ko"), koKr])).toBe(koKr);
  });

  it("không nhầm ngôn ngữ có tiền tố khác (kok-IN không phải tiếng Hàn... nhưng ko* match theo spec)", () => {
    // Theo thiết kế: chỉ cần bắt đầu bằng "ko"; đảm bảo hàm không crash với lang lạ
    expect(pickKoreanVoice([v("KO-KR", true, "Upper")])?.name).toBe("Upper");
  });
});

describe("isSpeechSupported (môi trường Node)", () => {
  it("trả về false khi không có window", () => {
    expect(isSpeechSupported()).toBe(false);
  });
});

describe("claimPlayback / releasePlayback", () => {
  it("claim mới sẽ dừng nguồn đang phát trước đó", () => {
    let stoppedA = false;
    const stopA = () => {
      stoppedA = true;
    };
    const stopB = () => {};

    claimPlayback(stopA);
    expect(stoppedA).toBe(false);
    claimPlayback(stopB);
    expect(stoppedA).toBe(true);
    releasePlayback(stopB);
  });

  it("claim lại chính mình không tự dừng mình", () => {
    let stopped = 0;
    const stop = () => {
      stopped++;
    };
    claimPlayback(stop);
    claimPlayback(stop);
    expect(stopped).toBe(0);
    releasePlayback(stop);
  });

  it("release chỉ gỡ khi đúng nguồn hiện tại", () => {
    let stoppedA = false;
    const stopA = () => {
      stoppedA = true;
    };
    const stopOther = () => {};
    claimPlayback(stopA);
    releasePlayback(stopOther); // không phải nguồn hiện tại → không gỡ
    claimPlayback(stopOther); // vẫn phải dừng A
    expect(stoppedA).toBe(true);
    releasePlayback(stopOther);
  });
});
