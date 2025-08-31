export function makeSessionId(localUserId: string, localDeviceId: string, remoteUserId: string, remoteDeviceId: string) {
  return `${localUserId}:${localDeviceId}:${remoteUserId}:${remoteDeviceId}`;
}
