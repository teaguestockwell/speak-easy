import { connectionStore, useStore } from "./connection-store";
import { Button } from "../../components";
import cn from "./media-picker.module.css";

const variants = [
  // "Audio Only",
  "Screen",
  "Front Camera",
  "Back Camera",
  "Cancel",
] as const;

type V = (typeof variants)[number];

const onSelect = (v: V) => async () => {
  const s = connectionStore.get();
  const { mediaDevices } = window.navigator;
  let ms: MediaStream | undefined;
  const constraints: MediaTrackConstraints = {
    frameRate: 20,
    width: { max: 1080 },
    height: { max: 1080 },
  };

  try {
    if (v === "Cancel") {
      // no op
    }
    // if (v === "Audio Only") {
    //   // https://github.com/peers/peerjs/issues/944
    //   const brokenStream = await mediaDevices.getUserMedia({
    //     audio: true,
    //     video: false,
    //   });
    //   const audios = brokenStream.getAudioTracks()
    //   const canvas = Object.assign(document.createElement("canvas"), {
    //     width: 1080,
    //     height: 1080,
    //   });
    //   canvas.getContext("2d")?.fillRect(0, 0, 1080, 1080);
    //   const stream = canvas.captureStream();
    //   audios.forEach(t => stream.addTrack(t))
    //   ms = stream;
    // }
    if (v === "Screen") {
      ms = await mediaDevices
        .getDisplayMedia({
          audio: true,
          video: true,
        })
        .catch();
      if (!ms) {
        alert("screen sharing is not supported on mobile");
      }
    }
    if (v === "Back Camera") {
      ms = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "environment" },
      });
      constraints.facingMode = "environment";
    }
    if (v === "Front Camera") {
      ms = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      constraints.facingMode = "user";
    }

    if (ms) {
      await Promise.all(
        ms.getTracks().map((t) => t.applyConstraints(constraints))
      );
    }

    connectionStore.lpc.connectCall(ms);
  } catch (e) {
    console.error(e)
    alert("please enable camera access in your device settings")
    connectionStore.lpc.connectCall(ms);
  }
};

const supportsTouch =
  typeof window !== "undefined"
    ? "ontouchstart" in window || navigator.maxTouchPoints
    : false;

const supported = variants.filter((e) =>
  supportsTouch ? e !== "Screen" : true
);

export const MediaPicker = () => {
  const status = useStore((s) => s.status);
  const { selectMediaVariant } = connectionStore.get();
  const action = selectMediaVariant === "grantor" ? "accept" : "place";
  const title = `Choose media to ${action} call`;

  if (status === "select-media") {
    return (
      <div className={cn.root}>
        <span className={cn.title}>{title}</span>
        {supported.map((v) => (
          <Button key={v} className={cn.but} onClick={onSelect(v)}>
            {v}
          </Button>
        ))}
      </div>
    );
  }
  return null;
};
