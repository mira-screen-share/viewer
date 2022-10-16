import React from "react";
import { createUUID } from "@/utils/uuid";
import { SharerConnectionConfig, SignallerUrl } from "@/config/webrtc";

const errorHandler = (error: any) => console.log(error);

export const App = () => {
    const uuid = createUUID();
    const video = React.createRef<HTMLVideoElement>();
    const sharerConnection = new RTCPeerConnection(SharerConnectionConfig);
    const serverConnection = new WebSocket(SignallerUrl);

    serverConnection.onmessage = (event) => {
        const signal = JSON.parse(event.data);

        if (signal.sdp) {
            sharerConnection
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .catch(errorHandler);
        } else if (signal.ice) {
            sharerConnection
                .addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(errorHandler);
        }
    };

    sharerConnection.onicecandidate = (event) => {
        if (event.candidate != null) {
            serverConnection.send(
                JSON.stringify({ice: event.candidate, uuid: uuid})
            );
        }
    };

    sharerConnection.ontrack = (event) => {
        video.current!.srcObject = event.streams[0];
    };

    const join = () => {
        sharerConnection.createOffer().then(description => {
            sharerConnection
                .setLocalDescription(description)
                .then(() => {
                    serverConnection.send(
                        JSON.stringify({
                            sdp: sharerConnection.localDescription,
                            uuid: uuid
                        })
                    );
                })
                .catch(errorHandler);
        }).catch(errorHandler);
    }

    return (
        <div>
            <video autoPlay muted ref={video}/>
            <input
                type="button"
                onClick={join}
                value="Join"
            />
        </div>
    );
}
