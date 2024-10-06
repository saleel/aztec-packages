#!/usr/bin/env node
import { Crs, Barretenberg, RawBuffer } from './index.js';
import { GrumpkinCrs } from './crs/node/index.js';
import createDebug from 'debug';
import { readFileSync, writeFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { Command } from 'commander';
import { Timer, writeBenchmark } from './benchmark/index.js';
import path from 'path';
createDebug.log = console.error.bind(console);
const debug = createDebug('bb.js');
// Maximum circuit size for plonk we support in node and the browser is 2^19.
// This is because both node and browser use barretenberg.wasm which has a 4GB memory limit.
//
// This is not a restriction in the bb binary and one should be
// aware of this discrepancy, when creating proofs in bb versus
// creating the same proofs in the node CLI.
const MAX_ULTRAPLONK_CIRCUIT_SIZE_IN_WASM = 2 ** 19;
const threads = +process.env.HARDWARE_CONCURRENCY || undefined;
function getBytecode(bytecodePath) {
    const extension = bytecodePath.substring(bytecodePath.lastIndexOf('.') + 1);
    if (extension == 'json') {
        const encodedCircuit = JSON.parse(readFileSync(bytecodePath, 'utf8'));
        const decompressed = gunzipSync(Buffer.from(encodedCircuit.bytecode, 'base64'));
        return decompressed;
    }
    const encodedCircuit = readFileSync(bytecodePath);
    const decompressed = gunzipSync(encodedCircuit);
    return decompressed;
}
async function getGatesUltra(bytecodePath, honkRecursion, api) {
    const { total } = await computeCircuitSize(bytecodePath, honkRecursion, api);
    return total;
}
function getWitness(witnessPath) {
    const data = readFileSync(witnessPath);
    const decompressed = gunzipSync(data);
    return decompressed;
}
async function computeCircuitSize(bytecodePath, honkRecursion, api) {
    debug(`computing circuit size...`);
    const bytecode = getBytecode(bytecodePath);
    const [exact, total, subgroup] = await api.acirGetCircuitSizes(bytecode, honkRecursion);
    return { exact, total, subgroup };
}
async function initUltraPlonk(bytecodePath, crsPath, subgroupSizeOverride = -1, honkRecursion = false) {
    const api = await Barretenberg.new({ threads });
    const circuitSize = await getGatesUltra(bytecodePath, honkRecursion, api);
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/811): remove subgroupSizeOverride hack for goblin
    const subgroupSize = Math.max(subgroupSizeOverride, Math.pow(2, Math.ceil(Math.log2(circuitSize))));
    if (subgroupSize > MAX_ULTRAPLONK_CIRCUIT_SIZE_IN_WASM) {
        throw new Error(`Circuit size of ${subgroupSize} exceeds max supported of ${MAX_ULTRAPLONK_CIRCUIT_SIZE_IN_WASM}`);
    }
    debug(`circuit size: ${circuitSize}`);
    debug(`subgroup size: ${subgroupSize}`);
    debug('loading crs...');
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1097): tighter bound needed
    // currently using 1.6x points in CRS because of structured polys, see notes for how to minimize
    // Needed here for initUltraPlonk because MegaHonk currently uses this function.
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(subgroupSize + Math.floor((subgroupSize * 6) / 10) + 1, crsPath);
    // Important to init slab allocator as first thing, to ensure maximum memory efficiency for Plonk.
    await api.commonInitSlabAllocator(subgroupSize);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(subgroupSize);
    return { api, acirComposer, circuitSize, subgroupSize };
}
async function initUltraHonk(bytecodePath, crsPath) {
    const api = await Barretenberg.new({ threads });
    const circuitSize = await getGatesUltra(bytecodePath, /*honkRecursion=*/ true, api);
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/811): remove subgroupSizeOverride hack for goblin
    const dyadicCircuitSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
    debug(`circuit size: ${circuitSize}`);
    debug(`dyadic circuit size size: ${dyadicCircuitSize}`);
    debug('loading crs...');
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1097): tighter bound needed
    // currently using 1.6x points in CRS because of structured polys, see notes for how to minimize
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(dyadicCircuitSize + Math.floor((dyadicCircuitSize * 6) / 10) + 1, crsPath);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    return { api, circuitSize, dyadicCircuitSize };
}
async function initClientIVC(bytecodePath, crsPath) {
    const api = await Barretenberg.new({ threads });
    debug('loading BN254 and Grumpkin crs...');
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1097): tighter bound needed
    // currently using 1.6x points in CRS because of structured polys, see notes for how to minimize
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(2 ** 19 + 1, crsPath);
    const grumpkinCrs = await GrumpkinCrs.new(2 ** 14 + 1, crsPath);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    await api.srsInitGrumpkinSrs(new RawBuffer(grumpkinCrs.getG1Data()), grumpkinCrs.numPoints);
    return { api };
}
async function initLite() {
    const api = await Barretenberg.new({ threads: 1 });
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(1);
    // Load CRS into wasm global CRS state.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(0);
    return { api, acirComposer };
}
export async function proveAndVerify(bytecodePath, witnessPath, crsPath) {
    /* eslint-disable camelcase */
    const acir_test = path.basename(process.cwd());
    const { api, acirComposer, circuitSize, subgroupSize } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const pkTimer = new Timer();
        await api.acirInitProvingKey(acirComposer, bytecode);
        writeBenchmark('pk_construction_time', pkTimer.ms(), { acir_test, threads });
        writeBenchmark('gate_count', circuitSize, { acir_test, threads });
        writeBenchmark('subgroup_size', subgroupSize, { acir_test, threads });
        const proofTimer = new Timer();
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness);
        writeBenchmark('proof_construction_time', proofTimer.ms(), { acir_test, threads });
        debug(`verifying...`);
        const verified = await api.acirVerifyProof(acirComposer, proof);
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
    /* eslint-enable camelcase */
}
export async function proveAndVerifyUltraHonk(bytecodePath, witnessPath, crsPath) {
    /* eslint-disable camelcase */
    const { api } = await initUltraHonk(bytecodePath, crsPath);
    try {
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const verified = await api.acirProveAndVerifyUltraHonk(bytecode, witness);
        return verified;
    }
    finally {
        await api.destroy();
    }
    /* eslint-enable camelcase */
}
export async function proveAndVerifyMegaHonk(bytecodePath, witnessPath, crsPath) {
    /* eslint-disable camelcase */
    const { api } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const verified = await api.acirProveAndVerifyMegaHonk(bytecode, witness);
        return verified;
    }
    finally {
        await api.destroy();
    }
    /* eslint-enable camelcase */
}
export async function foldAndVerifyProgram(bytecodePath, witnessPath, crsPath) {
    /* eslint-disable camelcase */
    const { api } = await initClientIVC(bytecodePath, crsPath);
    try {
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const verified = await api.acirFoldAndVerifyProgramStack(bytecode, witness);
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
    /* eslint-enable camelcase */
}
export async function prove(bytecodePath, witnessPath, crsPath, outputPath) {
    const { api, acirComposer } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness);
        debug(`done.`);
        if (outputPath === '-') {
            process.stdout.write(proof);
            debug(`proof written to stdout`);
        }
        else {
            writeFileSync(outputPath, proof);
            debug(`proof written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function gateCountUltra(bytecodePath, honkRecursion) {
    const api = await Barretenberg.new({ threads: 1 });
    try {
        const numberOfGates = await getGatesUltra(bytecodePath, honkRecursion, api);
        debug(`number of gates: : ${numberOfGates}`);
        // Create an 8-byte buffer and write the number into it.
        // Writing number directly to stdout will result in a variable sized
        // input depending on the size.
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64LE(BigInt(numberOfGates));
        process.stdout.write(buffer);
    }
    finally {
        await api.destroy();
    }
}
export async function verify(proofPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const verified = await api.acirVerifyProof(acirComposer, readFileSync(proofPath));
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function contract(outputPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const contract = await api.acirGetSolidityVerifier(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(contract);
            debug(`contract written to stdout`);
        }
        else {
            writeFileSync(outputPath, contract);
            debug(`contract written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function writeVk(bytecodePath, crsPath, outputPath) {
    const { api, acirComposer } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        debug('initing proving key...');
        const bytecode = getBytecode(bytecodePath);
        await api.acirInitProvingKey(acirComposer, bytecode);
        debug('initing verification key...');
        const vk = await api.acirGetVerificationKey(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(vk);
            debug(`vk written to stdout`);
        }
        else {
            writeFileSync(outputPath, vk);
            debug(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function writePk(bytecodePath, crsPath, outputPath) {
    const { api, acirComposer } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        debug('initing proving key...');
        const bytecode = getBytecode(bytecodePath);
        const pk = await api.acirGetProvingKey(acirComposer, bytecode);
        if (outputPath === '-') {
            process.stdout.write(pk);
            debug(`pk written to stdout`);
        }
        else {
            writeFileSync(outputPath, pk);
            debug(`pk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function proofAsFields(proofPath, vkPath, outputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing proof byte array into field elements');
        const numPublicInputs = readFileSync(vkPath).readUint32BE(8);
        const proofAsFields = await api.acirSerializeProofIntoFields(acirComposer, readFileSync(proofPath), numPublicInputs);
        const jsonProofAsFields = JSON.stringify(proofAsFields.map(f => f.toString()));
        if (outputPath === '-') {
            process.stdout.write(jsonProofAsFields);
            debug(`proofAsFields written to stdout`);
        }
        else {
            writeFileSync(outputPath, jsonProofAsFields);
            debug(`proofAsFields written to: ${outputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
export async function vkAsFields(vkPath, vkeyOutputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const [vkAsFields, vkHash] = await api.acirSerializeVerificationKeyIntoFields(acirComposer);
        const output = [vkHash, ...vkAsFields].map(f => f.toString());
        const jsonVKAsFields = JSON.stringify(output);
        if (vkeyOutputPath === '-') {
            process.stdout.write(jsonVKAsFields);
            debug(`vkAsFields written to stdout`);
        }
        else {
            writeFileSync(vkeyOutputPath, jsonVKAsFields);
            debug(`vkAsFields written to: ${vkeyOutputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
export async function proveUltraHonk(bytecodePath, witnessPath, crsPath, outputPath) {
    const { api } = await initUltraHonk(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirProveUltraHonk(bytecode, witness);
        debug(`done.`);
        if (outputPath === '-') {
            process.stdout.write(proof);
            debug(`proof written to stdout`);
        }
        else {
            writeFileSync(outputPath, proof);
            debug(`proof written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function writeVkUltraHonk(bytecodePath, crsPath, outputPath) {
    const { api } = await initUltraHonk(bytecodePath, crsPath);
    try {
        const bytecode = getBytecode(bytecodePath);
        debug('initing verification key...');
        const vk = await api.acirWriteVkUltraHonk(bytecode);
        if (outputPath === '-') {
            process.stdout.write(vk);
            debug(`vk written to stdout`);
        }
        else {
            writeFileSync(outputPath, vk);
            debug(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function verifyUltraHonk(proofPath, vkPath) {
    const { api } = await initLite();
    try {
        const verified = await api.acirVerifyUltraHonk(readFileSync(proofPath), new RawBuffer(readFileSync(vkPath)));
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function proofAsFieldsUltraHonk(proofPath, outputPath) {
    const { api } = await initLite();
    try {
        debug('outputting proof as vector of fields');
        const proofAsFields = await api.acirProofAsFieldsUltraHonk(readFileSync(proofPath));
        const jsonProofAsFields = JSON.stringify(proofAsFields.map(f => f.toString()));
        if (outputPath === '-') {
            process.stdout.write(jsonProofAsFields);
            debug(`proofAsFieldsUltraHonk written to stdout`);
        }
        else {
            writeFileSync(outputPath, jsonProofAsFields);
            debug(`proofAsFieldsUltraHonk written to: ${outputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
export async function vkAsFieldsUltraHonk(vkPath, vkeyOutputPath) {
    const { api } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        const vkAsFields = await api.acirVkAsFieldsUltraHonk(new RawBuffer(readFileSync(vkPath)));
        const jsonVKAsFields = JSON.stringify(vkAsFields.map(f => f.toString()));
        if (vkeyOutputPath === '-') {
            process.stdout.write(jsonVKAsFields);
            debug(`vkAsFieldsUltraHonk written to stdout`);
        }
        else {
            writeFileSync(vkeyOutputPath, jsonVKAsFields);
            debug(`vkAsFieldsUltraHonk written to: ${vkeyOutputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
const program = new Command('bb');
program.option('-v, --verbose', 'enable verbose logging', false);
program.option('-c, --crs-path <path>', 'set crs path', './crs');
function handleGlobalOptions() {
    if (program.opts().verbose) {
        createDebug.enable('bb.js*');
    }
}
program
    .command('prove_and_verify')
    .description('Generate a proof and verify it. Process exits with success or failure code.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .action(async ({ bytecodePath, witnessPath, crsPath }) => {
    handleGlobalOptions();
    const result = await proveAndVerify(bytecodePath, witnessPath, crsPath);
    process.exit(result ? 0 : 1);
});
program
    .command('prove_and_verify_ultra_honk')
    .description('Generate an UltraHonk proof and verify it. Process exits with success or failure code.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .action(async ({ bytecodePath, witnessPath, crsPath }) => {
    handleGlobalOptions();
    const result = await proveAndVerifyUltraHonk(bytecodePath, witnessPath, crsPath);
    process.exit(result ? 0 : 1);
});
program
    .command('prove_and_verify_mega_honk')
    .description('Generate a MegaHonk proof and verify it. Process exits with success or failure code.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .action(async ({ bytecodePath, witnessPath, crsPath }) => {
    handleGlobalOptions();
    const result = await proveAndVerifyMegaHonk(bytecodePath, witnessPath, crsPath);
    process.exit(result ? 0 : 1);
});
program
    .command('fold_and_verify_program')
    .description('Accumulate a set of circuits using ClientIvc then verify. Process exits with success or failure code.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .action(async ({ bytecodePath, witnessPath, crsPath }) => {
    handleGlobalOptions();
    const result = await foldAndVerifyProgram(bytecodePath, witnessPath, crsPath);
    process.exit(result ? 0 : 1);
});
program
    .command('prove')
    .description('Generate a proof and write it to a file.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .option('-o, --output-path <path>', 'Specify the proof output path', './proofs/proof')
    .action(async ({ bytecodePath, witnessPath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await prove(bytecodePath, witnessPath, crsPath, outputPath);
});
program
    .command('gates')
    .description('Print Ultra Builder gate count to standard output.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-hr, --honk-recursion', 'Specify whether to use UltraHonk recursion', false)
    .action(async ({ bytecodePath: bytecodePath, honkRecursion: honkRecursion }) => {
    handleGlobalOptions();
    await gateCountUltra(bytecodePath, honkRecursion);
});
program
    .command('verify')
    .description('Verify a proof. Process exists with success or failure code.')
    .requiredOption('-p, --proof-path <path>', 'Specify the path to the proof')
    .requiredOption('-k, --vk <path>', 'path to a verification key. avoids recomputation.')
    .action(async ({ proofPath, vk }) => {
    handleGlobalOptions();
    const result = await verify(proofPath, vk);
    process.exit(result ? 0 : 1);
});
program
    .command('contract')
    .description('Output solidity verification key contract.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-o, --output-path <path>', 'Specify the path to write the contract', './target/contract.sol')
    .requiredOption('-k, --vk-path <path>', 'Path to a verification key. avoids recomputation.')
    .action(async ({ outputPath, vkPath }) => {
    handleGlobalOptions();
    await contract(outputPath, vkPath);
});
program
    .command('write_vk')
    .description('Output verification key.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-o, --output-path <path>', 'Specify the path to write the key')
    .action(async ({ bytecodePath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await writeVk(bytecodePath, crsPath, outputPath);
});
program
    .command('write_pk')
    .description('Output proving key.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .requiredOption('-o, --output-path <path>', 'Specify the path to write the key')
    .action(async ({ bytecodePath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await writePk(bytecodePath, crsPath, outputPath);
});
program
    .command('proof_as_fields')
    .description('Return the proof as fields elements')
    .requiredOption('-p, --proof-path <path>', 'Specify the proof path')
    .requiredOption('-k, --vk-path <path>', 'Path to verification key.')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the proof fields')
    .action(async ({ proofPath, vkPath, outputPath }) => {
    handleGlobalOptions();
    await proofAsFields(proofPath, vkPath, outputPath);
});
program
    .command('vk_as_fields')
    .description('Return the verification key represented as fields elements. Also return the verification key hash.')
    .requiredOption('-k, --vk-path <path>', 'Path to verification key.')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the verification key fields and key hash')
    .action(async ({ vkPath, outputPath }) => {
    handleGlobalOptions();
    await vkAsFields(vkPath, outputPath);
});
program
    .command('prove_ultra_honk')
    .description('Generate a proof and write it to a file.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .option('-o, --output-path <path>', 'Specify the proof output path', './proofs/proof')
    .action(async ({ bytecodePath, witnessPath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await proveUltraHonk(bytecodePath, witnessPath, crsPath, outputPath);
});
program
    .command('write_vk_ultra_honk')
    .description('Output verification key.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/program.json')
    .requiredOption('-o, --output-path <path>', 'Specify the path to write the key')
    .action(async ({ bytecodePath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await writeVkUltraHonk(bytecodePath, crsPath, outputPath);
});
program
    .command('verify_ultra_honk')
    .description('Verify a proof. Process exists with success or failure code.')
    .requiredOption('-p, --proof-path <path>', 'Specify the path to the proof')
    .requiredOption('-k, --vk <path>', 'path to a verification key. avoids recomputation.')
    .action(async ({ proofPath, vk }) => {
    handleGlobalOptions();
    const result = await verifyUltraHonk(proofPath, vk);
    process.exit(result ? 0 : 1);
});
program
    .command('proof_as_fields_honk')
    .description('Return the proof as fields elements')
    .requiredOption('-p, --proof-path <path>', 'Specify the proof path')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the proof fields')
    .action(async ({ proofPath, outputPath }) => {
    handleGlobalOptions();
    await proofAsFieldsUltraHonk(proofPath, outputPath);
});
program
    .command('vk_as_fields_ultra_honk')
    .description('Return the verification key represented as fields elements.')
    .requiredOption('-k, --vk-path <path>', 'Path to verification key.')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the verification key fields.')
    .action(async ({ vkPath, outputPath }) => {
    handleGlobalOptions();
    await vkAsFieldsUltraHonk(vkPath, outputPath);
});
program.name('bb.js').parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDMUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ2xELE9BQU8sV0FBVyxNQUFNLE9BQU8sQ0FBQztBQUNoQyxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxNQUFNLElBQUksQ0FBQztBQUNqRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RCxPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsV0FBVyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5QyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFbkMsNkVBQTZFO0FBQzdFLDRGQUE0RjtBQUM1RixFQUFFO0FBQ0YsK0RBQStEO0FBQy9ELCtEQUErRDtBQUMvRCw0Q0FBNEM7QUFDNUMsTUFBTSxtQ0FBbUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BELE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBcUIsSUFBSSxTQUFTLENBQUM7QUFFaEUsU0FBUyxXQUFXLENBQUMsWUFBb0I7SUFDdkMsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVFLElBQUksU0FBUyxJQUFJLE1BQU0s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