export const SignallerUrl = "wss://ws.mirashare.app";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {urls: "stun:stun.l.google.com:19302"},
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
            credentialType: "password"
        }
    ],
};
