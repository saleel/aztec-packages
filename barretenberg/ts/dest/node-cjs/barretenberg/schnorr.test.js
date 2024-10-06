"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const index_js_1 = require("../types/index.js");
const index_js_2 = require("./index.js");
const index_js_3 = require("../async_map/index.js");
describe('schnorr', () => {
    const msg = Buffer.from(new util_1.TextEncoder().encode('The quick brown dog jumped over the lazy fox.'));
    let api;
    beforeAll(async () => {
        api = await index_js_2.Barretenberg.new({ threads: 1 });
    }, 30000);
    afterAll(async () => {
        await api.destroy();
    });
    it('should verify signature', async () => {
        const pk = index_js_1.Fr.fromBuffer(new Uint8Array([
            0x0b, 0x9b, 0x3a, 0xde, 0xe6, 0xb3, 0xd8, 0x1b, 0x28, 0xa0, 0x88, 0x6b, 0x2a, 0x84, 0x15, 0xc7, 0xda, 0x31,
            0x29, 0x1a, 0x5e, 0x96, 0xbb, 0x7a, 0x56, 0x63, 0x9e, 0x17, 0x7d, 0x30, 0x1b, 0xeb,
        ]));
        const pubKey = await api.schnorrComputePublicKey(pk);
        const [s, e] = await api.schnorrConstructSignature(msg, pk);
        const verified = await api.schnorrVerifySignature(msg, pubKey, s, e);
        expect(verified).toBe(true);
    });
    it('public key negation should work', async () => {
        const publicKeyStr = '0x164f01b1011a1b292217acf53eef4d74f625f6e9bd5edfdb74c56fd81aafeebb21912735f9266a3719f61c1eb747ddee0cac9917f5c807485d356709b529b62c';
        const publicKey = index_js_1.Point.fromString(publicKeyStr);
        // hardcoded expected negated public key
        const expectedInvertedStr = '0x164f01b1011a1b292217acf53eef4d74f625f6e9bd5edfdb74c56fd81aafeebb0ed3273ce80b35f29e5a2997ca397a6f1b874f3083f16948e6ac8e8a3ad649d5';
        const expectedInverted = index_js_1.Point.fromString(expectedInvertedStr);
        // negate - should match expected negated key
        const negatedPublicKey = await api.schnorrNegatePublicKey(publicKey);
        expect(negatedPublicKey.equals(expectedInverted)).toEqual(true);
        // negate again - should be original public key now
        expect((await api.schnorrNegatePublicKey(negatedPublicKey)).equals(publicKey)).toEqual(true);
    });
    it('should create + verify multi signature', async () => {
        // set up multisig accounts
        const numSigners = 7;
        const pks = [...Array(numSigners)].map(() => index_js_1.Fq.random());
        const pubKeys = await (0, index_js_3.asyncMap)(pks, pk => api.schnorrMultisigCreateMultisigPublicKey(pk));
        // round one
        const roundOnePublicOutputs = [];
        const roundOnePrivateOutputs = [];
        for (let i = 0; i < numSigners; ++i) {
            const [publicOutput, privateOutput] = await api.schnorrMultisigConstructSignatureRound1();
            roundOnePublicOutputs.push(publicOutput);
            roundOnePrivateOutputs.push(privateOutput);
        }
        // round two
        const roundTwoOutputs = await (0, index_js_3.asyncMap)(pks, async (pk, i) => (await api.schnorrMultisigConstructSignatureRound2(msg, pk, roundOnePrivateOutputs[i], pubKeys, roundOnePublicOutputs))[0]);
        // generate signature
        const [s, e] = await api.schnorrMultisigCombineSignatures(msg, pubKeys, roundOnePublicOutputs, roundTwoOutputs);
        const [combinedKey] = await api.schnorrMultisigValidateAndCombineSignerPubkeys(pubKeys);
        expect(combinedKey).not.toEqual(Buffer.alloc(64));
        const verified = await api.schnorrVerifySignature(msg, combinedKey, s, e);
        expect(verified).toBe(true);
    });
    it('should identify invalid multi signature', async () => {
        const pks = [...Array(3)].map(() => index_js_1.Fq.random());
        const pubKeys = await (0, index_js_3.asyncMap)(pks, pk => api.schnorrMultisigCreateMultisigPublicKey(pk));
        const [combinedKey] = await api.schnorrMultisigValidateAndCombineSignerPubkeys(pubKeys);
        const verified = await api.schnorrVerifySignature(msg, combinedKey, index_js_1.Buffer32.random(), index_js_1.Buffer32.random());
        expect(verified).toBe(false);
    });
    it('should not construct invalid multi signature', async () => {
        // set up multisig accounts
        const numSigners = 7;
        const pks = [...Array(numSigners)].map(() => index_js_1.Fq.random());
        const pubKeys = await (0, index_js_3.asyncMap)(pks, pk => api.schnorrMultisigCreateMultisigPublicKey(pk));
        // round one
        const roundOnePublicOutputs = [];
        const roundOnePrivateOutputs = [];
        for (let i = 0; i < numSigners; ++i) {
            const [publicOutput, privateOutput] = await api.schnorrMultisigConstructSignatureRound1();
            roundOnePublicOutputs.push(publicOutput);
            roundOnePrivateOutputs.push(privateOutput);
        }
        // round two
        const roundTwoOutputs = await (0, index_js_3.asyncMap)(pks, async (pk, i) => (await api.schnorrMultisigConstructSignatureRound2(msg, pk, roundOnePrivateOutputs[i], pubKeys, roundOnePublicOutputs))[0]);
        // wrong number of data
        {
            expect((await api.schnorrMultisigCombineSignatures(msg, pubKeys.slice(0, -1), roundOnePublicOutputs.slice(0, -1), roundTwoOutputs.slice(0, -1)))[2]).toBe(false);
        }
        // invalid round two output
        {
            const invalidOutputs = [...roundTwoOutputs];
            invalidOutputs[1] = (await api.schnorrMultisigConstructSignatureRound2(msg, pks[2], // <- Wrong private key.
            roundOnePrivateOutputs[1], pubKeys, roundOnePublicOutputs))[0];
            expect((await api.schnorrMultisigCombineSignatures(msg, pubKeys, roundOnePublicOutputs, invalidOutputs))[2]).toBe(false);
        }
        // contains duplicates
        {
            const invalidOutputs = [...roundTwoOutputs];
            invalidOutputs[1] = roundTwoOutputs[2];
            expect((await api.schnorrMultisigCombineSignatures(msg, pubKeys, roundOnePublicOutputs, invalidOutputs))[2]).toBe(false);
        }
    });
    it('should not create combined key from public keys containing invalid key', async () => {
        const pks = [...Array(5)].map(() => index_js_1.Fq.random());
        const pubKeys = await (0, index_js_3.asyncMap)(pks, pk => api.schnorrMultisigCreateMultisigPublicKey(pk));
        // not a valid point
        {
            pubKeys[1] = new index_js_1.Buffer128(Buffer.alloc(128));
            expect((await api.schnorrMultisigValidateAndCombineSignerPubkeys(pubKeys))[1]).toBe(false);
        }
        // contains duplicates
        {
            pubKeys[1] = pubKeys[2];
            expect((await api.schnorrMultisigValidateAndCombineSignerPubkeys(pubKeys))[1]).toBe(false);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nobm9yci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JhcnJldGVuYmVyZy9zY2hub3JyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBbUM7QUFDbkMsZ0RBQXVFO0FBQ3ZFLHlDQUEwQztBQUMxQyxvREFBaUQ7QUFFakQsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGtCQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsK0NBQStDLENBQUMsQ0FBQyxDQUFDO0lBQ25HLElBQUksR0FBaUIsQ0FBQztJQUV0QixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsR0FBRyxHQUFHLE1BQU0sdUJBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFVixRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbEIsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMseUJBQXlCLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDdkMsTUFBTSxFQUFFLEdBQUcsYUFBRSxDQUFDLFVBQVUsQ0FDdEIsSUFBSSxVQUFVLENBQUM7WUFDYixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDMUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJ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