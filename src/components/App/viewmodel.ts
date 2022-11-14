import {createUUID} from "@/utils/uuid";
import {SharerConnectionConfig, SignallerUrl} from "@/config/webrtc";
// @ts-ignore
import React from "react";
// @ts-ignore
import {action, computed, makeObservable, observable} from "mobx";

const onError = (error: any) => console.log(error);

type MouseAction = "mouse_up" | "mouse_down" | "mouse_move";
type KeyAction = "key_up" | "key_down";
const ButtonName = ["left", "middle", "right"];


export class AppViewModel {
    private sharerConnection = new RTCPeerConnection(SharerConnectionConfig);
    private serverConnection: WebSocket;
    private readonly room: string;
    private readonly uuid = createUUID();

    @observable
    private sharerEventChannel?: RTCDataChannel = undefined;

    @observable
    private joined = false;

    @observable
    private hide = false;

    @action
    private setJoined(joined: boolean) {
        this.joined = joined;
    }

    @action
    private setHide(hide: boolean) {
        this.hide = hide;
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

    public join = () => {
        this.serverConnection.send(
            JSON.stringify({
                type: "join",
                room: this.room,
                uuid: this.uuid,
            })
        );
    };

    public leave = () => {
        this.serverConnection.send(
            JSON.stringify({
                type: "leave",
                uuid: this.uuid,
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
        // TODO Revamp full screen
        // if (action == "up") {
        //     this.setHide(!this.hide);
        // }
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
            key: event.keyCode,
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

        this.room = params.get("room")!;
        this.serverConnection = new WebSocket(signaller);

        this.serverConnection.onmessage = (event) => {
            const signal = JSON.parse(event.data);
            console.log(signal);

            if (signal.uuid == this.uuid) return;

            switch (signal.type) {
                case "offer": // Offer from sharer
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
                                                uuid: this.uuid,
                                                to: this.room,
                                            })
                                        );
                                        this.setJoined(true);
                                    }).catch(onError);
                            }).catch(onError);
                        }).catch(onError);
                    break;
                case "ice":
                    this.sharerConnection
                        .addIceCandidate(new RTCIceCandidate(signal.ice))
                        .catch(onError);
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
                        uuid: this.uuid,
                        to: this.room,
                    })
                );
            }
        };

        this.sharerConnection.ontrack = (event) => {
            this.video.current!.srcObject = event.streams[0];
        };
    }
}
