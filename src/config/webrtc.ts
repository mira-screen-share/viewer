export const SignallerUrl = "wss://ws.mirashare.app";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {urls: "stun:stun.l.google.com:19302"},
    ],
};
