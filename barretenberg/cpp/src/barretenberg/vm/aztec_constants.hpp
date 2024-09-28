// GENERATED FILE - DO NOT EDIT, RUN yarn remake-constants in circuits.js
#pragma once

#define MAX_NOTE_HASHES_PER_CALL 16
#define MAX_NULLIFIERS_PER_CALL 16
#define MAX_PUBLIC_CALL_STACK_LENGTH_PER_CALL 16
#define MAX_L2_TO_L1_MSGS_PER_CALL 2
#define MAX_PUBLIC_DATA_UPDATE_REQUESTS_PER_CALL 32
#define MAX_PUBLIC_DATA_READS_PER_CALL 32
#define MAX_NOTE_HASH_READ_REQUESTS_PER_CALL 16
#define MAX_NULLIFIER_READ_REQUESTS_PER_CALL 16
#define MAX_NULLIFIER_NON_EXISTENT_READ_REQUESTS_PER_CALL 16
#define MAX_L1_TO_L2_MSG_READ_REQUESTS_PER_CALL 16
#define MAX_UNENCRYPTED_LOGS_PER_CALL 4
#define AZTEC_ADDRESS_LENGTH 1
#define GAS_FEES_LENGTH 2
#define GAS_LENGTH 2
#define CALL_CONTEXT_LENGTH 5
#define CONTENT_COMMITMENT_LENGTH 4
#define CONTRACT_STORAGE_READ_LENGTH 3
#define CONTRACT_STORAGE_UPDATE_REQUEST_LENGTH 3
#define GLOBAL_VARIABLES_LENGTH 9
#define APPEND_ONLY_TREE_SNAPSHOT_LENGTH 2
#define L2_TO_L1_MESSAGE_LENGTH 3
#define PARTIAL_STATE_REFERENCE_LENGTH 6
#define READ_REQUEST_LENGTH 2
#define LOG_HASH_LENGTH 3
#define NOTE_HASH_LENGTH 2
#define NULLIFIER_LENGTH 3
#define PUBLIC_INNER_CALL_REQUEST_LENGTH 14
#define STATE_REFERENCE_LENGTH 8
#define TOTAL_FEES_LENGTH 1
#define HEADER_LENGTH 24
#define PUBLIC_CIRCUIT_PUBLIC_INPUTS_LENGTH 691
#define PUBLIC_CONTEXT_INPUTS_LENGTH 42
#define AVM_VERIFICATION_KEY_LENGTH_IN_FIELDS 66
#define AVM_PROOF_LENGTH_IN_FIELDS 3822
#define AVM_PUBLIC_COLUMN_MAX_SIZE 1024
#define AVM_PUBLIC_INPUTS_FLATTENED_SIZE 2739
#define MEM_TAG_U1 1
#define MEM_TAG_U8 2
#define MEM_TAG_U16 3
#define MEM_TAG_U32 4
#define MEM_TAG_U64 5
#define MEM_TAG_U128 6
#define MEM_TAG_FF 7
#define SENDER_SELECTOR 0
#define ADDRESS_SELECTOR 1
#define STORAGE_ADDRESS_SELECTOR 1
#define FUNCTION_SELECTOR_SELECTOR 2
#define IS_STATIC_CALL_SELECTOR 4
#define START_GLOBAL_VARIABLES 29
#define CHAIN_ID_SELECTOR 29
#define VERSION_SELECTOR 30
#define BLOCK_NUMBER_SELECTOR 31
#define TIMESTAMP_SELECTOR 33
#define FEE_PER_DA_GAS_SELECTOR 36
#define FEE_PER_L2_GAS_SELECTOR 37
#define END_GLOBAL_VARIABLES 38
#define START_SIDE_EFFECT_COUNTER 38
#define TRANSACTION_FEE_SELECTOR 41
#define START_NOTE_HASH_EXISTS_WRITE_OFFSET 0
#define START_NULLIFIER_EXISTS_OFFSET 16
#define START_NULLIFIER_NON_EXISTS_OFFSET 32
#define START_L1_TO_L2_MSG_EXISTS_WRITE_OFFSET 48
#define START_SSTORE_WRITE_OFFSET 64
#define START_SLOAD_WRITE_OFFSET 96
#define START_EMIT_NOTE_HASH_WRITE_OFFSET 128
#define START_EMIT_NULLIFIER_WRITE_OFFSET 144
#define START_EMIT_L2_TO_L1_MSG_WRITE_OFFSET 160
#define START_EMIT_UNENCRYPTED_LOG_WRITE_OFFSET 162
#define AVM_ADD_BASE_L2_GAS 32
#define AVM_SUB_BASE_L2_GAS 32
#define AVM_MUL_BASE_L2_GAS 33
#define AVM_DIV_BASE_L2_GAS 43
#define AVM_FDIV_BASE_L2_GAS 32
#define AVM_EQ_BASE_L2_GAS 32
#define AVM_LT_BASE_L2_GAS 64
#define AVM_LTE_BASE_L2_GAS 64
#define AVM_AND_BASE_L2_GAS 33
#define AVM_OR_BASE_L2_GAS 33
#define AVM_XOR_BASE_L2_GAS 33
#define AVM_NOT_BASE_L2_GAS 27
#define AVM_SHL_BASE_L2_GAS 32
#define AVM_SHR_BASE_L2_GAS 32
#define AVM_CAST_BASE_L2_GAS 30
#define AVM_GETENVVAR_BASE_L2_GAS 20
#define AVM_CALLDATACOPY_BASE_L2_GAS 29
#define AVM_JUMP_BASE_L2_GAS 12
#define AVM_JUMPI_BASE_L2_GAS 18
#define AVM_INTERNALCALL_BASE_L2_GAS 18
#define AVM_INTERNALRETURN_BASE_L2_GAS 18
#define AVM_SET_BASE_L2_GAS 18
#define AVM_MOV_BASE_L2_GAS 23
#define AVM_CMOV_BASE_L2_GAS 34
#define AVM_SLOAD_BASE_L2_GAS 1218
#define AVM_SSTORE_BASE_L2_GAS 2642
#define AVM_NOTEHASHEXISTS_BASE_L2_GAS 986
#define AVM_EMITNOTEHASH_BASE_L2_GAS 2330
#define AVM_NULLIFIEREXISTS_BASE_L2_GAS 1226
#define AVM_EMITNULLIFIER_BASE_L2_GAS 2650
#define AVM_L1TOL2MSGEXISTS_BASE_L2_GAS 506
#define AVM_GETCONTRACTINSTANCE_BASE_L2_GAS 1248
#define AVM_EMITUNENCRYPTEDLOG_BASE_L2_GAS 18
#define AVM_SENDL2TOL1MSG_BASE_L2_GAS 226
#define AVM_CALL_BASE_L2_GAS 2445
#define AVM_STATICCALL_BASE_L2_GAS 2445
#define AVM_DELEGATECALL_BASE_L2_GAS 2445
#define AVM_RETURN_BASE_L2_GAS 28
#define AVM_REVERT_BASE_L2_GAS 28
#define AVM_DEBUGLOG_BASE_L2_GAS 10
#define AVM_KECCAK_BASE_L2_GAS 3000
#define AVM_POSEIDON2_BASE_L2_GAS 78
#define AVM_SHA256_BASE_L2_GAS 2610
#define AVM_PEDERSEN_BASE_L2_GAS 1000
#define AVM_ECADD_BASE_L2_GAS 62
#define AVM_MSM_BASE_L2_GAS 1000
#define AVM_PEDERSENCOMMITMENT_BASE_L2_GAS 1000
#define AVM_TORADIXLE_BASE_L2_GAS 46
#define AVM_SHA256COMPRESSION_BASE_L2_GAS 261
#define AVM_KECCAKF1600_BASE_L2_GAS 300
#define AVM_CALLDATACOPY_DYN_L2_GAS 6
#define AVM_EMITUNENCRYPTEDLOG_DYN_L2_GAS 146
#define AVM_CALL_DYN_L2_GAS 4
#define AVM_STATICCALL_DYN_L2_GAS 4
#define AVM_DELEGATECALL_DYN_L2_GAS 4
#define AVM_RETURN_DYN_L2_GAS 6
#define AVM_REVERT_DYN_L2_GAS 6
#define AVM_KECCAK_DYN_L2_GAS 100
#define AVM_SHA256_DYN_L2_GAS 100
#define AVM_PEDERSEN_DYN_L2_GAS 100
#define AVM_PEDERSENCOMMITMENT_DYN_L2_GAS 100
#define AVM_MSM_DYN_L2_GAS 100
#define AVM_TORADIXLE_DYN_L2_GAS 20
#define AVM_SSTORE_BASE_DA_GAS 512
#define AVM_EMITNOTEHASH_BASE_DA_GAS 512
#define AVM_EMITNULLIFIER_BASE_DA_GAS 512
#define AVM_SENDL2TOL1MSG_BASE_DA_GAS 512
#define AVM_EMITUNENCRYPTEDLOG_DYN_DA_GAS 512
