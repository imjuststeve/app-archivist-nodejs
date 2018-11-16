import { XyoBoundWitness, IXyoObject, IXyoHashProvider, IXyoPayload, XyoKeySet, XyoSignatureSet } from '@xyo-network/sdk-core-nodejs';

export async function transformBoundWitnessToXyoBlock(block: XyoBoundWitness, hashProvider: IXyoHashProvider) {
  const { hash, bytes, major, minor } = await getHashBytesMajorMinor(block, hashProvider);
  return {
    hash,
    bytes,
    major,
    minor,
    payloads: await getPayloads(block, hashProvider),
    publicKeys: await getPublicKeys(block, hashProvider),
    signatures: await getSignatures(block, hashProvider),
    signedHash: (await block.getHash(hashProvider)).serialize(true).toString('hex')
  };
}

export async function getHashBytesMajorMinor(xyoObject: IXyoObject, hashProvider: IXyoHashProvider) {
  const bytes = xyoObject.serialize(true);
  const hash = await hashProvider.createHash(bytes);

  return {
    hash: hash.serialize(true).toString('hex'),
    bytes: bytes.toString('hex'),
    major: xyoObject.major,
    minor: xyoObject.minor
  };
}

export async function transformPayload(payload: IXyoPayload, hashProvider: IXyoHashProvider) {
  const { hash, bytes, major, minor } = await getHashBytesMajorMinor(payload, hashProvider);
  return {
    hash,
    bytes,
    major,
    minor,
    signedPayload: await Promise.all(payload.signedPayload.array.map(async (signedPayloadItem) => {
      return getHashBytesMajorMinor(signedPayloadItem, hashProvider);
    })),
    unsignedPayload: await Promise.all(payload.unsignedPayload.array.map(async (unsignedPayloadItem) => {
      return getHashBytesMajorMinor(unsignedPayloadItem, hashProvider);
    }))
  };
}

export async function getPayloads(block: XyoBoundWitness, hashProvider: IXyoHashProvider) {
  return Promise.all(block.payloads.map(async (payload) => {
    return transformPayload(payload, hashProvider);
  }));
}

export async function getPublicKeys(block: XyoBoundWitness, hashProvider: IXyoHashProvider) {
  return Promise.all(block.publicKeys.map(async (publicKeySet) => {
    const { hash, bytes, major, minor } = await getHashBytesMajorMinor(publicKeySet, hashProvider);

    return {
      hash,
      bytes,
      major,
      minor,
      array: await Promise.all(publicKeySet.array.map((publicKey) => {
        return getHashBytesMajorMinor(publicKey, hashProvider);
      }))
    };
  }));
}

export async function transformKeySet(publicKeySet: XyoKeySet, hashProvider: IXyoHashProvider) {
  const { hash, bytes, major, minor } = await getHashBytesMajorMinor(publicKeySet, hashProvider);

  return {
    hash,
    bytes,
    major,
    minor,
    array: await Promise.all(publicKeySet.array.map((publicKey) => {
      return getHashBytesMajorMinor(publicKey, hashProvider);
    }))
  };
}

export async function transformSignatureSet(signatureSet: XyoSignatureSet, hashProvider: IXyoHashProvider) {
  const { hash, bytes, major, minor } = await getHashBytesMajorMinor(signatureSet, hashProvider);

  return {
    hash,
    bytes,
    major,
    minor,
    array: await Promise.all(
      signatureSet.array.map(async (signature) => {
        return getHashBytesMajorMinor(signature, hashProvider);
      })
    )
  };
}

async function getSignatures(block: XyoBoundWitness, hashProvider: IXyoHashProvider) {
  return Promise.all(block.signatures.map(async (signatureSet) => {
    return transformSignatureSet(signatureSet, hashProvider);
  }));
}
