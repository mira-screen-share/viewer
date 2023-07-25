import { createUUID } from "@/utils/uuid";
import { SharerConnectionConfig, SignallerUrl } from "@/config/webrtc";
// @ts-ignore
import React from "react";
// @ts-ignore
import { action, computed, makeObservable, observable } from "mobx";

const onError = (error: any) => console.log(error);

type MouseAction = "mouse_up" | "mouse_down" | "mouse_move";
type KeyAction = "key_up" | "key_down";
const ButtonName = ["left", "middle", "right"];


export class AppViewModel {
  private sharerConnection = new RTCPeerConnection(SharerConnectionConfig);
  private serverConnection: WebSocket;
  private readonly uuid = createUUID();
  private audioElement = document.createElement("audio");

  @observable
  private name: string = "";

  @observable
  private room: string = "";

  @observable
  private password: string = "";

  @observable
  private sharerEventChannel?: RTCDataChannel = undefined;

  @observable
  private joined = false;

  @observable
  private hide = false;

  @observable
  private mouseEnabled = false;

  @observable
  private mouseTrackEnabled = false;

  @observable
  private keyboardEnabled = false;

  @observable
  private fullScreen = false;

  @observable
  private showInteractPrompt = false;

  @action
  private setJoined(joined: boolean) {
    this.joined = joined;
  }

  @action
  public setHide = (hide: boolean) => () => {
    this.hide = hide;
  }

  @action
  public setRoom = (room: string) => {
    this.room = room;
  }

  @action
  public setName = (name: string) => {
    this.name = name;
  }

  @action
  public setPassword = (password: string) => {
    this.password = password;
  }

  @action
  public setMouseEnabled = (enabled: boolean) => () => {
    this.mouseEnabled = enabled;
    if (enabled) {
      this.video.current!.onmouseup = this.onVideoMouse("mouse_up");
      this.video.current!.onmousedown = this.onVideoMouse("mouse_down");
      this.video.current!.onmousemove = this.onVideoMouse("mouse_move");
      this.video.current!.onwheel = this.onVideoWheel;
      document.oncontextmenu = () => false;
    } else {
      this.video.current!.onmouseup = null;
      this.video.current!.onmousedown = null;
      this.video.current!.onmousemove = null;
      this.video.current!.onwheel = null;
      document.oncontextmenu = null;
    }
  }

  @action
  public setMouseTrackEnabled = (enabled: boolean) => () => {
    this.mouseTrackEnabled = enabled;
  }

  @action
  public setKeyboardEnabled = (enabled: boolean) => () => {
    this.keyboardEnabled = enabled;
    if (enabled) {
      document.onkeydown = this.onKeyAction("key_down");
      document.onkeyup = this.onKeyAction("key_up");
    } else {
      document.onkeydown = null;
      document.onkeyup = null;
    }
  }

  @action
  public setFullScreen = (enabled: boolean) => () => {
    this.fullScreen = enabled;
    if (enabled) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  @action
  private setEventChannel(channel: RTCDataChannel) {
    this.sharerEventChannel = channel
  }

  public readonly video = React.createRef<HTMLVideoElement>();

  @computed
  public get hasJoined() {
    return this.joined;
  }

  @computed
  public get isHiding() {
    return this.hide;
  }

  @computed
  public get isMouseEnabled() {
    return this.mouseEnabled;
  }

  @computed
  public get isMouseTrackEnabled() {
    return this.mouseTrackEnabled;
  }

  @computed
  public get isKeyboardEnabled() {
    return this.keyboardEnabled;
  }

  @computed
  public get isFullScreen() {
    return this.fullScreen;
  }

  @computed
  public get isInteractPrompt() {
    return this.showInteractPrompt;
  }

  @computed
  public get getRoom() {
    return this.room;
  }

  @computed
  public get getName() {
    return this.name;
  }

  @computed
  public get getPassword() {
    return this.password;
  }

  public join = () => {
    this.serverConnection.send(
      JSON.stringify({
        type: "join",
        room: this.room,
        from: this.uuid,
        name: this.name,
        auth: { "type": "password", "password": this.password }
      })
    );
  };

  public leave = () => {
    this.sharerConnection.close();
    this.serverConnection.send(
      JSON.stringify({
        type: "leave",
        from: this.uuid,
      })
    );
    this.setJoined(false);
  };

  public terminate = () => {
    if (this.hasJoined) {
      this.leave();
    }
    this.serverConnection.close();
  };

  public onVideoMouse = (action: MouseAction) => (event: MouseEvent) => {
    event.preventDefault();
    if (this.video.current!.videoWidth == 0
      || this.video.current!.videoHeight == 0) {
      return;
    }
    if (action == "mouse_move" && !this.isMouseTrackEnabled && !event.buttons) {
      return;
    }
    this.sharerEventChannel?.send(JSON.stringify({
      type: action,
      ...this.toSharerCoordinate(event.offsetX, event.offsetY),
      ...((action == "mouse_move") ? null : {
        button: ButtonName[event.button]
      }),
    }))
  };

  public onKeyAction = (action: KeyAction) => (event: KeyboardEvent) => {
    event.preventDefault();
    if (this.video.current!.videoWidth == 0
      || this.video.current!.videoHeight == 0) {
      return;
    }

    this.sharerEventChannel?.send(JSON.stringify({
      type: action,
      key: event.code,
    }))
  };

  public onVideoWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (this.video.current!.videoWidth == 0
      || this.video.current!.videoHeight == 0) {
      return;
    }
    this.sharerEventChannel?.send(JSON.stringify({
      type: "mouse_wheel",
      ...this.toSharerCoordinate(event.offsetX, event.offsetY),
      dx: event.deltaX,
      dy: event.deltaY,
    }))
  };

  public retryAudio = () => {
    this.audioElement.play();
    this.showInteractPrompt = false;
  }

  private toSharerCoordinate = (mouseX: number, mouseY: number) => {
    const viewW = this.video.current!.offsetWidth;
    const viewH = this.video.current!.offsetHeight;
    const videoW = this.video.current!.videoWidth;
    const videoH = this.video.current!.videoHeight;

    if ((viewH / viewW) > (videoH / videoW)) {
      // Extra space on top and bottom
      const scale = viewW / videoW;
      const x = mouseX / scale;
      const y = (mouseY - (viewH - videoH * scale) / 2) / scale;
      return {x: Math.round(x), y: Math.round(y)};
    } else {
      // Extra space on left and right
      const scale = viewH / videoH;
      const x = (mouseX - (viewW - videoW * scale) / 2) / scale;
      const y = mouseY / scale;
      return {x: Math.round(x), y: Math.round(y)};
    }
  };

  constructor() {
    makeObservable(this);

    const params = new URLSearchParams(window.location.search);
    const signaller = params.get("signaller") ?? SignallerUrl;

    this.room = params.get("room") ?? "";
    this.password = params.get("pwd") ?? "";
    this.serverConnection = new WebSocket(signaller);

    this.serverConnection.onmessage = (event) => {
      const signal = JSON.parse(event.data);

      if (signal.uuid == this.uuid) return;

      switch (signal.type) {
        case "offer": // Offer from sharer
          this.setJoined(true);
          this.sharerConnection
              .setRemoteDescription(new RTCSessionDescription(signal.sdp))
              .then(() => {
                // Reply answer
                this.sharerConnection.createAnswer().then(description => {
                  this.sharerConnection
                      .setLocalDescription(description)
                      .then(() => {
                        this.serverConnection.send(
                          JSON.stringify({
                            type: "answer",
                            sdp: description,
                            from: this.uuid,
                            to: this.room,
                          })
                        );
                      }).catch(onError);
                }).catch(onError);
              }).catch(onError);
          break;
        case "ice":
          this.sharerConnection
              .addIceCandidate(new RTCIceCandidate(signal.ice))
              .catch(onError);
          break;
        case "join_declined":
          alert("Join declined: Reason = " + signal.reason);
          break;
        default:
          break;
      }
    };

    this.sharerConnection.ondatachannel = (event) => this.setEventChannel(event.channel);

    this.sharerConnection.onicecandidate = (event) => {
      if (event.candidate != null) {
        this.serverConnection.send(
          JSON.stringify({
            type: "ice",
            ice: event.candidate,
            from: this.uuid,
            to: this.room,
          })
        );
      }
    };

    this.sharerConnection.ontrack = (event) => {
      console.log(2)
      if(event.track.kind == "video") {
        this.video.current!.srcObject = event.streams[0];
      } else if (event.track.kind == "audio") {
        this.audioElement.srcObject = event.streams[0];
        this.audioElement.play().catch(() => {
          this.showInteractPrompt = true;
        });
      } else {
        console.log("Unknown track: " + event.track.name);
      }
    };
  }
}
