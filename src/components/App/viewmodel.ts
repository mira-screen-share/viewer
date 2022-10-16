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
                join: true,
                uuid: this.uuid,
            })
        );
    };

    public leave = () => {
        this.serverConnection.send(
            JSON.stringify({
                leave: true,
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

    constructor() {
        makeObservable(this);

        this.serverConnection.onmessage = (event) => {
            const signal = JSON.parse(event.data);
            console.log(signal)

            if (signal.uuid == this.uuid) return;

            if (signal.sdp) { // Offer from sharer
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
                                            sdp: description,
                                            uuid: this.uuid,
                                        })
                                    );
                                    this.setJoined(true);
                                }).catch(onError);
                        }).catch(onError);
                    }).catch(onError);
            } else if (signal.ice) {
                this.sharerConnection
                    .addIceCandidate(new RTCIceCandidate(signal.ice))
                    .catch(onError);
            }
        };

        this.sharerConnection.onicecandidate = (event) => {
            if (event.candidate != null) {
                this.serverConnection.send(
                    JSON.stringify({ice: event.candidate, uuid: this.uuid})
                );
            }
        };

        this.sharerConnection.ontrack = (event) => {
            this.video.current!.srcObject = event.streams[0];
        };
    }
}
