export interface DeviceBundle {
  deviceId: string;
  identityPubEd25519: string;
  identityPubX25519: string;
  signedPreKeyPubX25519: string;
  signedPreKeySignature: string;
  oneTimePreKey?: [{ keyId: number; pubX25519: string }] | null;
}

export interface ChatDevice extends DeviceBundle  {
    id: string;
    userId: string;
    oneTimePreKeys: {
        keyId: number;
        pubX25519: string;
        consumedAt?: Date | undefined;
        createdAt?: Date | undefined;
    }[]
}

export interface SessionEvelope {
  toUserId: string;
  toDeviceId: string;
  type: string;
  initPacket: {
    ephPub: any;
  };
  fromUserId: string;
  fromDeviceId: string;
}

export interface MessageEnvelope {
  toUserId: string;
  toDeviceId: string;
  header: {
    dhPub_b64: string; // base64 of sender's DH public key for this message (X25519)
    pn: number; // previous chain length
    n: number; // message number within sending chain
  };
  ciphertext: string;
  nonce: string;
  fromUserId: string;
  fromDeviceId: string;
  meta?: { [key: string]: any } | null;
}


