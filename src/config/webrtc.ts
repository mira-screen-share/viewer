export const SignallerUrl = "ws://localhost:8443";
// export const SignallerUrl = "ws://192.168.0.63:8443";
// export const SignallerUrl = "ws://2.tcp.ngrok.io:18923";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {urls: "stun:stun.l.google.com:19302"},
    ],
};
