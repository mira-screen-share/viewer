// export const SignallerUrl = "ws://localhost:8443";
export const SignallerUrl = "ws://localhost:8443";
// export const SignallerUrl = "ws://4.tcp.ngrok.io:13986";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {urls: "stun:stun.l.google.com:19302"},
    ],
};
