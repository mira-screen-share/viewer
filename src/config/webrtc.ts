export const SignallerUrl = "wss://localhost:8443";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {urls: "stun:stun.l.google.com:19302"},
    ],
};
