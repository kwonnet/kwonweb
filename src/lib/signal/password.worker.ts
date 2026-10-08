import sodium from 'libsodium-wrappers-sumo';
self.onmessage = async (event: MessageEvent<{
    passphrase: string;
    salt: Uint8Array;
}>) => {
    try {
        await sodium.ready;
        const key = sodium.crypto_pwhash(32, event.data.passphrase, event.data.salt, 3, 64 * 1024 * 1024, sodium.crypto_pwhash_ALG_ARGON2ID13);
        self.postMessage({ key });
    }
    catch {
        self.postMessage({ error: 'Unable to unlock encrypted storage' });
    }
};
