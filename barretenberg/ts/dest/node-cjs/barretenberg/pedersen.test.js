"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const timer_js_1 = require("../benchmark/timer.js");
const index_js_2 = require("../types/index.js");
describe('pedersen sync', () => {
    let api;
    beforeAll(async () => {
        api = await index_js_1.BarretenbergSync.new();
    });
    it('pedersenHash', () => {
        const result = api.pedersenHash([new index_js_2.Fr(4n), new index_js_2.Fr(8n)], 7);
        expect(result).toMatchSnapshot();
    });
    it('pedersenHash perf test', () => {
        const loops = 1000;
        const fields = Array.from({ length: loops * 2 }).map(() => index_js_2.Fr.random());
        const t = new timer_js_1.Timer();
        for (let i = 0; i < loops; ++i) {
            api.pedersenHash([fields[i * 2], fields[i * 2 + 1]], 0);
        }
        const us = t.us() / loops;
        console.log(`Executed ${loops} hashes at an average ${us}us / hash`);
    });
    it('pedersenHashes perf test', () => {
        const loops = 10;
        const numHashesPerLoop = 1024;
        const fields = Array.from({ length: numHashesPerLoop * 2 }).map(() => index_js_2.Fr.random());
        const t = new timer_js_1.Timer();
        for (let i = 0; i < loops; ++i) {
            api.pedersenHashes(fields, 0);
        }
        const us = t.us() / (numHashesPerLoop * loops);
        console.log(`Executed ${numHashesPerLoop * loops} hashes at an average ${us}us / hash`);
    });
    it('pedersenHashBuffer', () => {
        const input = Buffer.alloc(123);
        input.writeUint32BE(321, 0);
        input.writeUint32BE(456, 119);
        const r = api.pedersenHashBuffer(input, 0);
        expect(r).toMatchSnapshot();
    });
    it('pedersenCommit', () => {
        const result = api.pedersenCommit([new index_js_2.Fr(4n), new index_js_2.Fr(8n), new index_js_2.Fr(12n)], 0);
        expect(result).toMatchSnapshot();
    });
    it.skip('pedersenCommit perf test', () => {
        const loops = 1000;
        const fields = Array.from({ length: loops * 2 }).map(() => index_js_2.Fr.random());
        const t = new timer_js_1.Timer();
        for (let i = 0; i < loops; ++i) {
            api.pedersenCommit([fields[i * 2], fields[i * 2 + 1]], 0);
        }
        console.log(t.us() / loops);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkZXJzZW4udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iYXJyZXRlbmJlcmcvcGVkZXJzZW4udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlDQUE4QztBQUM5QyxvREFBOEM7QUFDOUMsZ0RBQXVDO0FBRXZDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO0lBQzdCLElBQUksR0FBcUIsQ0FBQztJQUUxQixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkIsR0FBRyxHQUFHLE1BQU0sMkJBQWdCLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDckMsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUN0QixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxhQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3RCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsR0FBRyxJQUFJLGdCQUFLLEVBQUUsQ0FBQztRQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDL0IsR0FBRyxD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