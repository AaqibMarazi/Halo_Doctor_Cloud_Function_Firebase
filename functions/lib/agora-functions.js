"use strict";
const functions = require("firebase-functions");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
exports.generateToken = functions.https.onCall(async (request, response) => {
    try {
        const channelName = request.channelName;
        if (!channelName) {
            return resp.status(500).json({ error: "channel is required" });
        }
        let uid = request.uid;
        if (!uid || uid == "") {
            uid = 0;
        }
        let role = RtcRole.SUBSCRIBER;
        if (request.role == "publisher") {
            role = RtcRole.PUBLISHER;
        }
        let expireTime = request.expireTime;
        if (!expireTime || expireTime == "") {
            expireTime = 3600;
        }
        else {
            expireTime = parseInt(expireTime, 10);
        }
        // calculate privilege expire time
        const currentTime = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTime + expireTime;
        const agoraAppId = functions.config().agora.agora_appid;
        const agoraCertificate = functions.config().agora.agora_certificate;
        const token = RtcTokenBuilder.buildTokenWithUid(agoraAppId, agoraCertificate, channelName, uid, role, privilegeExpireTime);
        console.log("token : " + token);
        console.log("room name : " + channelName);
        return token;
    }
    catch (e) {
        throw e;
    }
});
//# sourceMappingURL=agora-functions.js.map