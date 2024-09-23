// AUTOGENERATED FILE
#pragma once

#include "barretenberg/plonk/proof_system/types/proof.hpp"
#include "barretenberg/sumcheck/sumcheck.hpp"
#include "barretenberg/vm/avm/generated/flavor.hpp"

namespace bb {

class AvmVerifier {
    using Flavor = AvmFlavor;
    using FF = Flavor::FF;
    using Commitment = Flavor::Commitment;
    using VerificationKey = Flavor::VerificationKey;
    using VerifierCommitmentKey = Flavor::VerifierCommitmentKey;
    using Transcript = Flavor::Transcript;

  public:
    explicit AvmVerifier(std::shared_ptr<VerificationKey> verifier_key);
    AvmVerifier(AvmVerifier&& other) noexcept;
    AvmVerifier(const AvmVerifier& other) = delete;

    AvmVerifier& operator=(const AvmVerifier& other) = delete;
    AvmVerifier& operator=(AvmVerifier&& other) noexcept;

    bool verify_proof(const HonkProof& proof, const std::vector<std::vector<FF>>& public_inputs);

    std::shared_ptr<VerificationKey> key;
    std::map<std::string, Commitment> commitments;
    std::shared_ptr<Transcript> transcript;

  private:
    FF evaluate_public_input_column(const std::vector<FF>& points, std::vector<FF> challenges);
};

} // namespace bb