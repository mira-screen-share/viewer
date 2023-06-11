export const SignallerUrl = "wss://ws.mirashare.app";

export const SharerConnectionConfig: RTCConfiguration = {
    iceServers: [
        {urls: "stun:stun.stunprotocol.org:3478"},
        {
            urls: "turn:a.relay.metered.ca:80",
            username: "1e6b66759383c6e39f455026",
            credential: "x2Lcuvxk2xOj5gVc",
        },
        {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: "1e6b66759383c6e39f455026",
            credential: "x2Lcuvxk2xOj5gVc",
        },
        {
            urls: "turn:a.relay.metered.ca:443",
            username: "1e6b66759383c6e39f455026",
            credential: "x2Lcuvxk2xOj5gVc",
        },
        {
            urls: "turn:a.relay.metered.ca:443?transport=tcp",
            username: "1e6b66759383c6e39f455026",
            credential: "x2Lcuvxk2xOj5gVc",
        },
    ],
};
