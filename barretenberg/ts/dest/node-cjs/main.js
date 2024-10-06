#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vkAsFieldsUltraHonk = exports.proofAsFieldsUltraHonk = exports.verifyUltraHonk = exports.writeVkUltraHonk = exports.proveUltraHonk = exports.vkAsFields = exports.proofAsFields = exports.writePk = exports.writeVk = exports.contract = exports.verify = exports.gateCountUltra = exports.prove = exports.foldAndVerifyProgram = exports.proveAndVerifyMegaHonk = exports.proveAndVerifyUltraHonk = exports.proveAndVerify = void 0;
const tslib_1 = require("tslib");
const index_js_1 = require("./index.js");
const index_js_2 = require("./crs/node/index.js");
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const commander_1 = require("commander");
const index_js_3 = require("./benchmark/index.js");
const path_1 = tslib_1.__importDefault(require("path"));
debug_1.default.log = console.error.bind(console);
const debug = (0, debug_1.default)('bb.js');
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
        const encodedCircuit = JSON.parse((0, fs_1.readFileSync)(bytecodePath, 'utf8'));
        const decompressed = (0, zlib_1.gunzipSync)(Buffer.from(encodedCircuit.bytecode, 'base64'));
        return decompressed;
    }
    const encodedCircuit = (0, fs_1.readFileSync)(bytecodePath);
    const decompressed = (0, zlib_1.gunzipSync)(encodedCircuit);
    return decompressed;
}
async function getGatesUltra(bytecodePath, honkRecursion, api) {
    const { total } = await computeCircuitSize(bytecodePath, honkRecursion, api);
    return total;
}
function getWitness(witnessPath) {
    const data = (0, fs_1.readFileSync)(witnessPath);
    const decompressed = (0, zlib_1.gunzipSync)(data);
    return decompressed;
}
async function computeCircuitSize(bytecodePath, honkRecursion, api) {
    debug(`computing circuit size...`);
    const bytecode = getBytecode(bytecodePath);
    const [exact, total, subgroup] = await api.acirGetCircuitSizes(bytecode, honkRecursion);
    return { exact, total, subgroup };
}
async function initUltraPlonk(bytecodePath, crsPath, subgroupSizeOverride = -1, honkRecursion = false) {
    const api = await index_js_1.Barretenberg.new({ threads });
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
    const crs = await index_js_1.Crs.new(subgroupSize + Math.floor((subgroupSize * 6) / 10) + 1, crsPath);
    // Important to init slab allocator as first thing, to ensure maximum memory efficiency for Plonk.
    await api.commonInitSlabAllocator(subgroupSize);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new index_js_1.RawBuffer(crs.getG1Data()), crs.numPoints, new index_js_1.RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(subgroupSize);
    return { api, acirComposer, circuitSize, subgroupSize };
}
async function initUltraHonk(bytecodePath, crsPath) {
    const api = await index_js_1.Barretenberg.new({ threads });
    const circuitSize = await getGatesUltra(bytecodePath, /*honkRecursion=*/ true, api);
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/811): remove subgroupSizeOverride hack for goblin
    const dyadicCircuitSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
    debug(`circuit size: ${circuitSize}`);
    debug(`dyadic circuit size size: ${dyadicCircuitSize}`);
    debug('loading crs...');
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1097): tighter bound needed
    // currently using 1.6x points in CRS because of structured polys, see notes for how to minimize
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await index_js_1.Crs.new(dyadicCircuitSize + Math.floor((dyadicCircuitSize * 6) / 10) + 1, crsPath);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new index_js_1.RawBuffer(crs.getG1Data()), crs.numPoints, new index_js_1.RawBuffer(crs.getG2Data()));
    return { api, circuitSize, dyadicCircuitSize };
}
async function initClientIVC(bytecodePath, crsPath) {
    const api = await index_js_1.Barretenberg.new({ threads });
    debug('loading BN254 and Grumpkin crs...');
    // TODO(https://github.com/AztecProtocol/barretenberg/issues/1097): tighter bound needed
    // currently using 1.6x points in CRS because of structured polys, see notes for how to minimize
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await index_js_1.Crs.new(2 ** 19 + 1, crsPath);
    const grumpkinCrs = await index_js_2.GrumpkinCrs.new(2 ** 14 + 1, crsPath);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new index_js_1.RawBuffer(crs.getG1Data()), crs.numPoints, new index_js_1.RawBuffer(crs.getG2Data()));
    await api.srsInitGrumpkinSrs(new index_js_1.RawBuffer(grumpkinCrs.getG1Data()), grumpkinCrs.numPoints);
    return { api };
}
async function initLite() {
    const api = await index_js_1.Barretenberg.new({ threads: 1 });
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await index_js_1.Crs.new(1);
    // Load CRS into wasm global CRS state.
    await api.srsInitSrs(new index_js_1.RawBuffer(crs.getG1Data()), crs.numPoints, new index_js_1.RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(0);
    return { api, acirComposer };
}
async function proveAndVerify(bytecodePath, witnessPath, crsPath) {
    /* eslint-disable camelcase */
    const acir_test = path_1.default.basename(process.cwd());
    const { api, acirComposer, circuitSize, subgroupSize } = await initUltraPlonk(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const pkTimer = new index_js_3.Timer();
        await api.acirInitProvingKey(acirComposer, bytecode);
        (0, index_js_3.writeBenchmark)('pk_construction_time', pkTimer.ms(), { acir_test, threads });
        (0, index_js_3.writeBenchmark)('gate_count', circuitSize, { acir_test, threads });
        (0, index_js_3.writeBenchmark)('subgroup_size', subgroupSize, { acir_test, threads });
        const proofTimer = new index_js_3.Timer();
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness);
        (0, index_js_3.writeBenchmark)('proof_construction_time', proofTimer.ms(), { acir_test, threads });
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
exports.proveAndVerify = proveAndVerify;
async function proveAndVerifyUltraHonk(bytecodePath, witnessPath, crsPath) {
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
exports.proveAndVerifyUltraHonk = proveAndVerifyUltraHonk;
async function proveAndVerifyMegaHonk(bytecodePath, witnessPath, crsPath) {
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
exports.proveAndVerifyMegaHonk = proveAndVerifyMegaHonk;
async function foldAndVerifyProgram(bytecodePath, witnessPath, crsPath) {
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
exports.foldAndVerifyProgram = foldAndVerifyProgram;
async function prove(bytecodePath, witnessPath, crsPath, outputPath) {
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
            (0, fs_1.writeFileSync)(outputPath, proof);
            debug(`proof written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.prove = prove;
async function gateCountUltra(bytecodePath, honkRecursion) {
    const api = await index_js_1.Barretenberg.new({ threads: 1 });
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
exports.gateCountUltra = gateCountUltra;
async function verify(proofPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new index_js_1.RawBuffer((0, fs_1.readFileSync)(vkPath)));
        const verified = await api.acirVerifyProof(acirComposer, (0, fs_1.readFileSync)(proofPath));
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
exports.verify = verify;
async function contract(outputPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new index_js_1.RawBuffer((0, fs_1.readFileSync)(vkPath)));
        const contract = await api.acirGetSolidityVerifier(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(contract);
            debug(`contract written to stdout`);
        }
        else {
            (0, fs_1.writeFileSync)(outputPath, contract);
            debug(`contract written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.contract = contract;
async function writeVk(bytecodePath, crsPath, outputPath) {
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
            (0, fs_1.writeFileSync)(outputPath, vk);
            debug(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.writeVk = writeVk;
async function writePk(bytecodePath, crsPath, outputPath) {
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
            (0, fs_1.writeFileSync)(outputPath, pk);
            debug(`pk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.writePk = writePk;
async function proofAsFields(proofPath, vkPath, outputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing proof byte array into field elements');
        const numPublicInputs = (0, fs_1.readFileSync)(vkPath).readUint32BE(8);
        const proofAsFields = await api.acirSerializeProofIntoFields(acirComposer, (0, fs_1.readFileSync)(proofPath), numPublicInputs);
        const jsonProofAsFields = JSON.stringify(proofAsFields.map(f => f.toString()));
        if (outputPath === '-') {
            process.stdout.write(jsonProofAsFields);
            debug(`proofAsFields written to stdout`);
        }
        else {
            (0, fs_1.writeFileSync)(outputPath, jsonProofAsFields);
            debug(`proofAsFields written to: ${outputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
exports.proofAsFields = proofAsFields;
async function vkAsFields(vkPath, vkeyOutputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        await api.acirLoadVerificationKey(acirComposer, new index_js_1.RawBuffer((0, fs_1.readFileSync)(vkPath)));
        const [vkAsFields, vkHash] = await api.acirSerializeVerificationKeyIntoFields(acirComposer);
        const output = [vkHash, ...vkAsFields].map(f => f.toString());
        const jsonVKAsFields = JSON.stringify(output);
        if (vkeyOutputPath === '-') {
            process.stdout.write(jsonVKAsFields);
            debug(`vkAsFields written to stdout`);
        }
        else {
            (0, fs_1.writeFileSync)(vkeyOutputPath, jsonVKAsFields);
            debug(`vkAsFields written to: ${vkeyOutputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
exports.vkAsFields = vkAsFields;
async function proveUltraHonk(bytecodePath, witnessPath, crsPath, outputPath) {
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
            (0, fs_1.writeFileSync)(outputPath, proof);
            debug(`proof written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.proveUltraHonk = proveUltraHonk;
async function writeVkUltraHonk(bytecodePath, crsPath, outputPath) {
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
            (0, fs_1.writeFileSync)(outputPath, vk);
            debug(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
exports.writeVkUltraHonk = writeVkUltraHonk;
async function verifyUltraHonk(proofPath, vkPath) {
    const { api } = await initLite();
    try {
        const verified = await api.acirVerifyUltraHonk((0, fs_1.readFileSync)(proofPath), new index_js_1.RawBuffer((0, fs_1.readFileSync)(vkPath)));
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
exports.verifyUltraHonk = verifyUltraHonk;
async function proofAsFieldsUltraHonk(proofPath, outputPath) {
    const { api } = await initLite();
    try {
        debug('outputting proof as vector of fields');
        const proofAsFields = await api.acirProofAsFieldsUltraHonk((0, fs_1.readFileSync)(proofPath));
        const jsonProofAsFields = JSON.stringify(proofAsFields.map(f => f.toString()));
        if (outputPath === '-') {
            process.stdout.write(jsonProofAsFields);
            debug(`proofAsFieldsUltraHonk written to stdout`);
        }
        else {
            (0, fs_1.writeFileSync)(outputPath, jsonProofAsFields);
            debug(`proofAsFieldsUltraHonk written to: ${outputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
exports.proofAsFieldsUltraHonk = proofAsFieldsUltraHonk;
async function vkAsFieldsUltraHonk(vkPath, vkeyOutputPath) {
    const { api } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        const vkAsFields = await api.acirVkAsFieldsUltraHonk(new index_js_1.RawBuffer((0, fs_1.readFileSync)(vkPath)));
        const jsonVKAsFields = JSON.stringify(vkAsFields.map(f => f.toString()));
        if (vkeyOutputPath === '-') {
            process.stdout.write(jsonVKAsFields);
            debug(`vkAsFieldsUltraHonk written to stdout`);
        }
        else {
            (0, fs_1.writeFileSync)(vkeyOutputPath, jsonVKAsFields);
            debug(`vkAsFieldsUltraHonk written to: ${vkeyOutputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
exports.vkAsFieldsUltraHonk = vkAsFieldsUltraHonk;
const program = new commander_1.Command('bb');
program.option('-v, --verbose', 'enable verbose logging', false);
program.option('-c, --crs-path <path>', 'set crs path', './crs');
function handleGlobalOptions() {
    if (program.opts().verbose) {
        debug_1.default.enable('bb.js*');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0EseUNBQTBEO0FBQzFELGtEQUFrRDtBQUNsRCwwREFBZ0M7QUFDaEMsMkJBQWlEO0FBQ2pELCtCQUFrQztBQUNsQyx5Q0FBb0M7QUFDcEMsbURBQTZEO0FBQzdELHdEQUF3QjtBQUN4QixlQUFXLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUEsZUFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRW5DLDZFQUE2RTtBQUM3RSw0RkFBNEY7QUFDNUYsRUFBRTtBQUNGLCtEQUErRDtBQUMvRCwrREFBK0Q7QUFDL0QsNENBQTRDO0FBQzVDLE1BQU0sbUNBQW1DLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwRCxNQUFNLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQXFCLElBQUksU0FBUyxDQUFDO0FBRWhFLFNBQVMsV0FBVyxDQUFDLFlBQW9CO0lBQ3ZDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU1RSxJQUFJLFNBQVMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN4QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUEsaUJBQVksRUFBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLFlBQVksR0FBRyxJQUFBLGlCQUFVLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDaEYsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVELE1BQU0sY0FB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