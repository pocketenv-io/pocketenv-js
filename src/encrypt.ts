import sodium from "libsodium-wrappers";

export async function encrypt(message: string, publicKeyHex: string): Promise<string> {
  await sodium.ready;
  const sealed = sodium.crypto_box_seal(
    sodium.from_string(message),
    sodium.from_hex(publicKeyHex),
  );
  return sodium.to_base64(sealed, sodium.base64_variants.URLSAFE_NO_PADDING);
}
