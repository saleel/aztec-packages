"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../crs/index.js");
const index_js_2 = require("../barretenberg/index.js");
const index_js_3 = require("../types/index.js");
describe('simple', () => {
    let api;
    beforeAll(async () => {
        api = await index_js_2.Barretenberg.new();
        // Important to init slab allocator as first thing, to ensure maximum memory efficiency.
        const CIRCUIT_SIZE = 2 ** 19;
        await api.commonInitSlabAllocator(CIRCUIT_SIZE);
        const crs = await index_js_1.Crs.new(2 ** 19 + 1);
        await api.srsInitSrs(new index_js_3.RawBuffer(crs.getG1Data()), crs.numPoints, new index_js_3.RawBuffer(crs.getG2Data()));
    }, 60000);
    afterAll(async () => {
        await api.destroy();
    });
    it('should construct 512k gate proof', async () => {
        const valid = await api.examplesSimpleCreateAndVerifyProof();
        expect(valid).toBe(true);
    }, 300000);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXhhbXBsZXMvc2ltcGxlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw4Q0FBc0M7QUFDdEMsdURBQXdEO0FBQ3hELGdEQUE4QztBQUU5QyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtJQUN0QixJQUFJLEdBQWlCLENBQUM7SUFFdEIsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLEdBQUcsR0FBRyxNQUFNLHVCQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFL0Isd0ZBQXdGO1FBQ3hGLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsTUFBTSxHQUFHLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxjQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksb0JBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksb0JBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVWLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNsQixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNoRCxNQUFNLEtBQUssR0FBRyxNQUFNLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO1FBQzdELE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxDQUFDLENBQUMifQ==