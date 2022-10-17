import { createUUID } from "@/utils/uuid";
import { SharerConnectionConfig, SignallerUrl } from "@/config/webrtc";
import React from "react";
import { action, computed, makeObservable, observable } from "mobx";

const onError = (error: any) => console.log(error);

export class AppViewModel {
    private sharerConnection = new RTCPeerConnection(SharerConnectionConfig);
    private serverConnection = new WebSocket(SignallerUrl);

    @observable
    private joined = false;

    @action
    private setJoined(joined: boolean) {
        this.joined = joined;
    }

    public readonly uuid = createUUID();
    public readonly video = React.createRef<HTMLVideoElement>();

    @computed
    public get hasJoined() {
        return this.joined;
    }

    public join = () => {
        this.serverConnection.send(
            JSON.stringify({
                type: "join",
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

    public onVideoClick = (event: MouseEvent) => {
        event.preventDefault();
        if (this.video.current!.videoWidth == 0
            || this.video.current!.videoHeight == 0) {
            return;
        }
        console.log({
            type: "click",
            ...this.toSharerCoordinate(event.offsetX, event.offsetY),
        });
    };

    public onVideoWheel = (event: WheelEvent) => {
        event.preventDefault();
        if (this.video.current!.videoWidth == 0
            || this.video.current!.videoHeight == 0) {
            return;
        }
        console.log({
            type: "scroll",
            ...this.toSharerCoordinate(event.offsetX, event.offsetY),
            dx: event.deltaX,
            dy: event.deltaY,
        });
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
            return {x: x, y: y};
        } else {
            // Extra space on left and right
            const scale = viewH / videoH;
            const x = (mouseX - (viewW - videoW * scale) / 2) / scale;
            const y = mouseY / scale;
            return {x: x, y: y};
        }
    };

    constructor() {
        makeObservable(this);

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

        this.sharerConnection.onicecandidate = (event) => {
            if (event.candidate != null) {
                this.serverConnection.send(
                    JSON.stringify({
                        type: "ice",
                        ice: event.candidate,
                        uuid: this.uuid
                    })
                );
            }
        };

        this.sharerConnection.ontrack = (event) => {
            this.video.current!.srcObject = event.streams[0];
        };
    }
}
