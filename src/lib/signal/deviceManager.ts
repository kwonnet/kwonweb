// DeviceManager.ts
import { get, set } from "idb-keyval";
import { KeyHelper } from "@privacyresearch/libsignal-protocol-typescript";

export class DeviceManager {
  private constructor(
    private readonly userId: string,
    private readonly deviceId: string,
    private readonly identityKeyPair: any,
    private readonly registrationId: number
  ) {}

  /**
   * Async factory to create and initialize a DeviceManager instance.
   */
  static async create(userId: string): Promise<DeviceManager> {
    // Device ID
    let deviceId = await get("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      await set("deviceId", deviceId);
    }

    // Identity Key Pair
    let identityKeyPair = await get("identityKeyPair");
    if (!identityKeyPair) {
      identityKeyPair = await KeyHelper.generateIdentityKeyPair();
      await set("identityKeyPair", identityKeyPair);
    }

    // Registration ID
    let registrationId = await get("registrationId");
    if (!registrationId) {
      registrationId = KeyHelper.generateRegistrationId();
      await set("registrationId", registrationId);
    }

    return new DeviceManager(userId, deviceId, identityKeyPair, registrationId);
  }

  // --- Getters ---
  getUserId(): string {
    return this.userId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getIdentityKeyPair(): any {
    return this.identityKeyPair;
  }

  getRegistrationId(): number {
    return this.registrationId;
  }

  async exportBundle() {
    // Export to server so others can start sessions with this device
    const preKeys = [];
    for (let i = 1; i <= 50; i++) {
      const preKey = await KeyHelper.generatePreKey(i);
      preKeys.push(preKey);
    }
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      this.identityKeyPair,
      1
    );

    return {
      userId: this.userId,
      deviceId: this.deviceId,
      registrationId: this.registrationId,
      identityKey: this.identityKeyPair.pubKey,
      preKeys,
      signedPreKey,
    };
  }
}