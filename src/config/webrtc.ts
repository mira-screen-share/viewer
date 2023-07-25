export const SignallerUrl = "wss://ws.mirashare.app";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
    ],
};
