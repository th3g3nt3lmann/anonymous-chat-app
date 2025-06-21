// Generates an ECDH key pair for secure key exchange.
export async function generateKeyPair() {
    return await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
    );
}

// Exports a crypto key to a raw format for transmission.
export async function exportKey(key) {
    return await crypto.subtle.exportKey('raw', key);
}

// Imports a raw key to a crypto key object.
export async function importKey(keyData) {
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
    );
}

// Derives a shared secret key for AES-GCM encryption from a private key and a peer's public key.
export async function deriveSharedSecret(privateKey, publicKey) {
    return await crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypts a text message using AES-GCM.
export async function encryptMessage(key, text) {
    const encoded = new TextEncoder().encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    return {
        ciphertext: new Uint8Array(ciphertext),
        iv: iv,
    };
}

// Decrypts a message using AES-GCM.
export async function decryptMessage(key, { ciphertext, iv }) {
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(ciphertext)
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "Failed to decrypt message.";
    }
} 