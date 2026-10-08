/** Attachment secrets stay inside the Signal channel; relay receives ciphertext only. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf']);
export interface AttachmentSecret {
    v: 1;
    blobId: string;
    keyB64: string;
    ivB64: string;
    ciphertextSha256B64: string;
    ciphertextBytes: number;
    mime: string;
    filename: string;
    plaintextBytes: number;
}
export function base64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
}
export function unbase64(value: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
function aad(conversationId: string, blobId: string): Uint8Array<ArrayBuffer> {
    return new TextEncoder().encode(JSON.stringify(['kwonnet-attachment', 1, conversationId, blobId]));
}
export async function encryptAttachment(file: File, conversationId: string, blobId: string) {
    if (file.size > MAX_FILE_BYTES || !allowedTypes.has(file.type))
        throw new Error('Unsupported attachment');
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(conversationId, blobId), tagLength: 128 }, key, await file.arrayBuffer());
    const secret: AttachmentSecret = {
        v: 1, blobId, keyB64: base64(new Uint8Array(await crypto.subtle.exportKey('raw', key))), ivB64: base64(iv),
        ciphertextSha256B64: base64(new Uint8Array(await crypto.subtle.digest('SHA-256', ciphertext))),
        ciphertextBytes: ciphertext.byteLength, plaintextBytes: file.size, mime: file.type,
        filename: file.name.replace(/[\u0000-\u001f/\\]/g, '').slice(0, 200),
    };
    return { blob: new Blob([ciphertext], { type: 'application/octet-stream' }), secret };
}
export async function decryptAttachment(secret: AttachmentSecret, ciphertext: ArrayBuffer, conversationId: string): Promise<Blob> {
    if (secret.v !== 1 || ciphertext.byteLength !== secret.ciphertextBytes || ciphertext.byteLength > MAX_FILE_BYTES + 16 ||
        !Number.isSafeInteger(secret.plaintextBytes) || secret.plaintextBytes < 0 || secret.plaintextBytes > MAX_FILE_BYTES ||
        !allowedTypes.has(secret.mime))
        throw new Error('Invalid attachment');
    const rawKey = unbase64(secret.keyB64), iv = unbase64(secret.ivB64);
    if (rawKey.length !== 32 || iv.length !== 12)
        throw new Error('Invalid attachment key');
    if (base64(new Uint8Array(await crypto.subtle.digest('SHA-256', ciphertext))) !== secret.ciphertextSha256B64)
        throw new Error('Attachment integrity failure');
    const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    rawKey.fill(0);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad(conversationId, secret.blobId), tagLength: 128 }, key, ciphertext);
    if (plaintext.byteLength !== secret.plaintextBytes)
        throw new Error('Invalid attachment size');
    return new Blob([plaintext], { type: secret.mime });
}
