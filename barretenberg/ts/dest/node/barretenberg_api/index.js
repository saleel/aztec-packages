import { BufferDeserializer, NumberDeserializer, VectorDeserializer, BoolDeserializer, StringDeserializer, serializeBufferable, } from '../serialize/index.js';
import { Fr, Fq, Point, Buffer32, Buffer128, Ptr } from '../types/index.js';
export class BarretenbergApi {
    constructor(wasm) {
        this.wasm = wasm;
    }
    async pedersenCommit(inputsBuffer, ctxIndex) {
        const inArgs = [inputsBuffer, ctxIndex].map(serializeBufferable);
        const outTypes = [Point];
        const result = await this.wasm.callWasmExport('pedersen_commit', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHash(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('pedersen_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHashes(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('pedersen_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async pedersenHashBuffer(inputBuffer, hashIndex) {
        const inArgs = [inputBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('pedersen_hash_buffer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Hash(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('poseidon2_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Hashes(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('poseidon2_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async poseidon2Permutation(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = await this.wasm.callWasmExport('poseidon2_permutation', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async blake2s(data) {
        const inArgs = [data].map(serializeBufferable);
        const outTypes = [Buffer32];
        const result = await this.wasm.callWasmExport('blake2s', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async blake2sToField(data) {
        const inArgs = [data].map(serializeBufferable);
        const outTypes = [Fr];
        const result = await this.wasm.callWasmExport('blake2s_to_field_', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrComputePublicKey(privateKey) {
        const inArgs = [privateKey].map(serializeBufferable);
        const outTypes = [Point];
        const result = await this.wasm.callWasmExport('schnorr_compute_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrNegatePublicKey(publicKeyBuffer) {
        const inArgs = [publicKeyBuffer].map(serializeBufferable);
        const outTypes = [Point];
        const result = await this.wasm.callWasmExport('schnorr_negate_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrConstructSignature(message, privateKey) {
        const inArgs = [message, privateKey].map(serializeBufferable);
        const outTypes = [Buffer32, Buffer32];
        const result = await this.wasm.callWasmExport('schnorr_construct_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const inArgs = [message, pubKey, sigS, sigE].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('schnorr_verify_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const inArgs = [privateKey].map(serializeBufferable);
        const outTypes = [Buffer128];
        const result = await this.wasm.callWasmExport('schnorr_multisig_create_multisig_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const inArgs = [signerPubkeyBuf].map(serializeBufferable);
        const outTypes = [Point, BoolDeserializer()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigConstructSignatureRound1() {
        const inArgs = [].map(serializeBufferable);
        const outTypes = [Buffer128, Buffer128];
        const result = await this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_1', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const inArgs = [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf].map(serializeBufferable);
        const outTypes = [Fq, BoolDeserializer()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_2', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const inArgs = [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf].map(serializeBufferable);
        const outTypes = [Buffer32, Buffer32, BoolDeserializer()];
        const result = await this.wasm.callWasmExport('schnorr_multisig_combine_signatures', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async aesEncryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('aes_encrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async aesDecryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('aes_decrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const inArgs = [pointsBuf, numPoints, g2PointBuf].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('srs_init_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async srsInitGrumpkinSrs(pointsBuf, numPoints) {
        const inArgs = [pointsBuf, numPoints].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('srs_init_grumpkin_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async examplesSimpleCreateAndVerifyProof() {
        const inArgs = [].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('examples_simple_create_and_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async testThreads(threads, iterations) {
        const inArgs = [threads, iterations].map(serializeBufferable);
        const outTypes = [NumberDeserializer()];
        const result = await this.wasm.callWasmExport('test_threads', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async commonInitSlabAllocator(circuitSize) {
        const inArgs = [circuitSize].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('common_init_slab_allocator', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirGetCircuitSizes(constraintSystemBuf, honkRecursion) {
        const inArgs = [constraintSystemBuf, honkRecursion].map(serializeBufferable);
        const outTypes = [NumberDeserializer(), NumberDeserializer(), NumberDeserializer()];
        const result = await this.wasm.callWasmExport('acir_get_circuit_sizes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async acirNewAcirComposer(sizeHint) {
        const inArgs = [sizeHint].map(serializeBufferable);
        const outTypes = [Ptr];
        const result = await this.wasm.callWasmExport('acir_new_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirDeleteAcirComposer(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_delete_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_init_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('acir_create_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProveAndVerifyUltraHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('acir_prove_and_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProveAndVerifyMegaHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('acir_prove_and_verify_mega_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirFoldAndVerifyProgramStack(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('acir_fold_and_verify_program_stack', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const inArgs = [acirComposerPtr, vkBuf].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_load_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirInitVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [];
        const result = await this.wasm.callWasmExport('acir_init_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    async acirGetVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('acir_get_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirGetProvingKey(acirComposerPtr, acirVec) {
        const inArgs = [acirComposerPtr, acirVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('acir_get_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVerifyProof(acirComposerPtr, proofBuf) {
        const inArgs = [acirComposerPtr, proofBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('acir_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirGetSolidityVerifier(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [StringDeserializer()];
        const result = await this.wasm.callWasmExport('acir_get_solidity_verifier', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const inArgs = [acirComposerPtr, proofBuf, numInnerPublicInputs].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = await this.wasm.callWasmExport('acir_serialize_proof_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr), Fr];
        const result = await this.wasm.callWasmExport('acir_serialize_verification_key_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    async acirProveUltraHonk(acirVec, witnessVec) {
        const inArgs = [acirVec, witnessVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('acir_prove_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVerifyUltraHonk(proofBuf, vkBuf) {
        const inArgs = [proofBuf, vkBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = await this.wasm.callWasmExport('acir_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirWriteVkUltraHonk(acirVec) {
        const inArgs = [acirVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = await this.wasm.callWasmExport('acir_write_vk_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirProofAsFieldsUltraHonk(proofBuf) {
        const inArgs = [proofBuf].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = await this.wasm.callWasmExport('acir_proof_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    async acirVkAsFieldsUltraHonk(vkBuf) {
        const inArgs = [vkBuf].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = await this.wasm.callWasmExport('acir_vk_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
}
export class BarretenbergApiSync {
    constructor(wasm) {
        this.wasm = wasm;
    }
    pedersenCommit(inputsBuffer, ctxIndex) {
        const inArgs = [inputsBuffer, ctxIndex].map(serializeBufferable);
        const outTypes = [Point];
        const result = this.wasm.callWasmExport('pedersen_commit', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHash(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('pedersen_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHashes(inputsBuffer, hashIndex) {
        const inArgs = [inputsBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('pedersen_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    pedersenHashBuffer(inputBuffer, hashIndex) {
        const inArgs = [inputBuffer, hashIndex].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('pedersen_hash_buffer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Hash(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('poseidon2_hash', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Hashes(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('poseidon2_hashes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    poseidon2Permutation(inputsBuffer) {
        const inArgs = [inputsBuffer].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = this.wasm.callWasmExport('poseidon2_permutation', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    blake2s(data) {
        const inArgs = [data].map(serializeBufferable);
        const outTypes = [Buffer32];
        const result = this.wasm.callWasmExport('blake2s', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    blake2sToField(data) {
        const inArgs = [data].map(serializeBufferable);
        const outTypes = [Fr];
        const result = this.wasm.callWasmExport('blake2s_to_field_', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrComputePublicKey(privateKey) {
        const inArgs = [privateKey].map(serializeBufferable);
        const outTypes = [Point];
        const result = this.wasm.callWasmExport('schnorr_compute_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrNegatePublicKey(publicKeyBuffer) {
        const inArgs = [publicKeyBuffer].map(serializeBufferable);
        const outTypes = [Point];
        const result = this.wasm.callWasmExport('schnorr_negate_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrConstructSignature(message, privateKey) {
        const inArgs = [message, privateKey].map(serializeBufferable);
        const outTypes = [Buffer32, Buffer32];
        const result = this.wasm.callWasmExport('schnorr_construct_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrVerifySignature(message, pubKey, sigS, sigE) {
        const inArgs = [message, pubKey, sigS, sigE].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('schnorr_verify_signature', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrMultisigCreateMultisigPublicKey(privateKey) {
        const inArgs = [privateKey].map(serializeBufferable);
        const outTypes = [Buffer128];
        const result = this.wasm.callWasmExport('schnorr_multisig_create_multisig_public_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    schnorrMultisigValidateAndCombineSignerPubkeys(signerPubkeyBuf) {
        const inArgs = [signerPubkeyBuf].map(serializeBufferable);
        const outTypes = [Point, BoolDeserializer()];
        const result = this.wasm.callWasmExport('schnorr_multisig_validate_and_combine_signer_pubkeys', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigConstructSignatureRound1() {
        const inArgs = [].map(serializeBufferable);
        const outTypes = [Buffer128, Buffer128];
        const result = this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_1', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigConstructSignatureRound2(message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf) {
        const inArgs = [message, privateKey, signerRoundOnePrivateBuf, signerPubkeysBuf, roundOnePublicBuf].map(serializeBufferable);
        const outTypes = [Fq, BoolDeserializer()];
        const result = this.wasm.callWasmExport('schnorr_multisig_construct_signature_round_2', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    schnorrMultisigCombineSignatures(message, signerPubkeysBuf, roundOneBuf, roundTwoBuf) {
        const inArgs = [message, signerPubkeysBuf, roundOneBuf, roundTwoBuf].map(serializeBufferable);
        const outTypes = [Buffer32, Buffer32, BoolDeserializer()];
        const result = this.wasm.callWasmExport('schnorr_multisig_combine_signatures', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    aesEncryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('aes_encrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    aesDecryptBufferCbc(input, iv, key, length) {
        const inArgs = [input, iv, key, length].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('aes_decrypt_buffer_cbc', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    srsInitSrs(pointsBuf, numPoints, g2PointBuf) {
        const inArgs = [pointsBuf, numPoints, g2PointBuf].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('srs_init_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    srsInitGrumpkinSrs(pointsBuf, numPoints) {
        const inArgs = [pointsBuf, numPoints].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('srs_init_grumpkin_srs', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    examplesSimpleCreateAndVerifyProof() {
        const inArgs = [].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('examples_simple_create_and_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    testThreads(threads, iterations) {
        const inArgs = [threads, iterations].map(serializeBufferable);
        const outTypes = [NumberDeserializer()];
        const result = this.wasm.callWasmExport('test_threads', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    commonInitSlabAllocator(circuitSize) {
        const inArgs = [circuitSize].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('common_init_slab_allocator', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirGetCircuitSizes(constraintSystemBuf, honkRecursion) {
        const inArgs = [constraintSystemBuf, honkRecursion].map(serializeBufferable);
        const outTypes = [NumberDeserializer(), NumberDeserializer(), NumberDeserializer()];
        const result = this.wasm.callWasmExport('acir_get_circuit_sizes', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    acirNewAcirComposer(sizeHint) {
        const inArgs = [sizeHint].map(serializeBufferable);
        const outTypes = [Ptr];
        const result = this.wasm.callWasmExport('acir_new_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirDeleteAcirComposer(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_delete_acir_composer', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirInitProvingKey(acirComposerPtr, constraintSystemBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_init_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirCreateProof(acirComposerPtr, constraintSystemBuf, witnessBuf) {
        const inArgs = [acirComposerPtr, constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('acir_create_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProveAndVerifyUltraHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('acir_prove_and_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProveAndVerifyMegaHonk(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('acir_prove_and_verify_mega_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirFoldAndVerifyProgramStack(constraintSystemBuf, witnessBuf) {
        const inArgs = [constraintSystemBuf, witnessBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('acir_fold_and_verify_program_stack', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirLoadVerificationKey(acirComposerPtr, vkBuf) {
        const inArgs = [acirComposerPtr, vkBuf].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_load_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirInitVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [];
        const result = this.wasm.callWasmExport('acir_init_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return;
    }
    acirGetVerificationKey(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('acir_get_verification_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirGetProvingKey(acirComposerPtr, acirVec) {
        const inArgs = [acirComposerPtr, acirVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('acir_get_proving_key', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVerifyProof(acirComposerPtr, proofBuf) {
        const inArgs = [acirComposerPtr, proofBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('acir_verify_proof', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirGetSolidityVerifier(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [StringDeserializer()];
        const result = this.wasm.callWasmExport('acir_get_solidity_verifier', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirSerializeProofIntoFields(acirComposerPtr, proofBuf, numInnerPublicInputs) {
        const inArgs = [acirComposerPtr, proofBuf, numInnerPublicInputs].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = this.wasm.callWasmExport('acir_serialize_proof_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirSerializeVerificationKeyIntoFields(acirComposerPtr) {
        const inArgs = [acirComposerPtr].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr), Fr];
        const result = this.wasm.callWasmExport('acir_serialize_verification_key_into_fields', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out;
    }
    acirProveUltraHonk(acirVec, witnessVec) {
        const inArgs = [acirVec, witnessVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('acir_prove_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVerifyUltraHonk(proofBuf, vkBuf) {
        const inArgs = [proofBuf, vkBuf].map(serializeBufferable);
        const outTypes = [BoolDeserializer()];
        const result = this.wasm.callWasmExport('acir_verify_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirWriteVkUltraHonk(acirVec) {
        const inArgs = [acirVec].map(serializeBufferable);
        const outTypes = [BufferDeserializer()];
        const result = this.wasm.callWasmExport('acir_write_vk_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirProofAsFieldsUltraHonk(proofBuf) {
        const inArgs = [proofBuf].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = this.wasm.callWasmExport('acir_proof_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
    acirVkAsFieldsUltraHonk(vkBuf) {
        const inArgs = [vkBuf].map(serializeBufferable);
        const outTypes = [VectorDeserializer(Fr)];
        const result = this.wasm.callWasmExport('acir_vk_as_fields_ultra_honk', inArgs, outTypes.map(t => t.SIZE_IN_BYTES));
        const out = result.map((r, i) => outTypes[i].fromBuffer(r));
        return out[0];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnX2FwaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixrQkFBa0IsRUFDbEIsZ0JBQWdCLEVBQ2hCLGtCQUFrQixFQUNsQixtQkFBbUIsR0FFcEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUU1RSxNQUFNLE9BQU8sZUFBZTtJQUMxQixZQUFzQixJQUE0QjtRQUE1QixTQUFJLEdBQUosSUFBSSxDQUF3QjtJQUFHLENBQUM7SUFFdEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFrQixFQUFFLFFBQWdCO1FBQ3ZELE1BQU0sTUFBTSxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sUUFBUSxHQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQzNDLGlCQUFpQixFQUNqQixNQUFNLEVBQ04sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FDbkMsQ0FBQztRQUNGLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVELEtB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