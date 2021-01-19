import * as admin from "firebase-admin";
import { addGCPSettings } from "./add-gcp-settings";

export async function initializeFirebase() {
  await addGCPSettings();
  admin.initializeApp();
}

export function addToken(token: string, topic: string) {
  admin.messaging().subscribeToTopic(token, topic);
}

export function removeToken(token: string, topic: string) {
  admin.messaging().unsubscribeFromTopic(token, topic);
}

export function sendMessage(title: string, body: string, topic: string) {
  return admin.messaging().sendToTopic(topic, {
    notification: {
      title: title,
      body: body,
      icon: "https://coroname.net/assets/icon/favicon.png",
    },
  });
}
