conversations/{convId}      : { type: "direct" | "group", name, members: {uid: true}, createdBy, createdAt }
messages/{convId}/{msgId}   : { senderId, type: "text" | "image" | "location", text, imageUrl, lat, lng, createdAt, recalled, reactions: {uid: emoji} }
userChats/{uid}/{convId}    : { lastMessage, lastSenderId, updatedAt, unread }
readStatus/{convId}/{uid}   : thời điểm đọc cuối
typing/{convId}/{uid}       : true
notifications/{uid}/{id}    : { type, convId, fromUid, text, createdAt, read }
users/{uid}                 : { name, email, online, lastSeen }