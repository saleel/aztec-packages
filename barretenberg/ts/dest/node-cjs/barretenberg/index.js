"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarretenbergSync = exports.Barretenberg = exports.UltraHonkBackend = exports.UltraPlonkBackend = exports.BarretenbergVerifier = void 0;
const tslib_1 = require("tslib");
const comlink_1 = require("comlink");
const index_js_1 = require("../barretenberg_api/index.js");
const index_js_2 = require("../barretenberg_wasm/barretenberg_wasm_main/factory/node/index.js");
const index_js_3 = require("../barretenberg_wasm/barretenberg_wasm_main/index.js");
const index_js_4 = require("../barretenberg_wasm/helpers/index.js");
const index_js_5 = require("../barretenberg_wasm/index.js");
const debug_1 = tslib_1.__importDefault(require("debug"));
const index_js_6 = require("../crs/index.js");
const raw_buffer_js_1 = require("../types/raw_buffer.js");
var verifier_js_1 = require("./verifier.js");
Object.defineProperty(exports, "BarretenbergVerifier", { enumerable: true, get: function () { return verifier_js_1.BarretenbergVerifier; } });
var backend_js_1 = require("./backend.js");
Object.defineProperty(exports, "UltraPlonkBackend", { enumerable: true, get: function () { return backend_js_1.UltraPlonkBackend; } });
Object.defineProperty(exports, "UltraHonkBackend", { enumerable: true, get: function () { return backend_js_1.UltraHonkBackend; } });
const debug = (0, debug_1.default)('bb.js:wasm');
/**
 * The main class library consumers interact with.
 * It extends the generated api, and provides a static constructor "new" to compose components.
 */
class Barretenberg extends index_js_1.BarretenbergApi {
    constructor(worker, wasm, options) {
        super(wasm);
        this.worker = worker;
        this.options = options;
    }
    /**
     * Constructs an instance of Barretenberg.
     * Launches it within a worker. This is necessary as it blocks waiting on child threads to complete,
     * and blocking the main thread in the browser is not allowed.
     * It threads > 1 (defaults to hardware availability), child threads will be created on their own workers.
     */
    static async new(options = {}) {
        const worker = (0, index_js_2.createMainWorker)();
        const wasm = (0, index_js_4.getRemoteBarretenbergWasm)(worker);
        const { module, threads } = await (0, index_js_5.fetchModuleAndThreads)(options.threads);
        await wasm.init(module, threads, (0, comlink_1.proxy)(debug), options.memory?.initial, options.memory?.maximum);
        return new Barretenberg(worker, wasm, options);
    }
    async getNumThreads() {
        return await this.wasm.getNumThreads();
    }
    async initSRSForCircuitSize(circuitSize) {
        const crs = await index_js_6.Crs.new(circuitSize + Math.floor((circuitSize * 6) / 10) + 1, this.options.crsPath);
        await this.commonInitSlabAllocator(circuitSize);
        await this.srsInitSrs(new raw_buffer_js_1.RawBuffer(crs.getG1Data()), crs.numPoints, new raw_buffer_js_1.RawBuffer(crs.getG2Data()));
    }
    async acirInitSRS(bytecode, honkRecursion) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_exact, _total, subgroupSize] = await this.acirGetCircuitSizes(bytecode, honkRecursion);
        return this.initSRSForCircuitSize(subgroupSize);
    }
    async destroy() {
        await this.wasm.destroy();
        await this.worker.terminate();
    }
}
exports.Barretenberg = Barretenberg;
let barretenbergSyncSingleton;
let barretenbergSyncSingletonPromise;
class BarretenbergSync extends index_js_1.BarretenbergApiSync {
    constructor(wasm) {
        super(wasm);
    }
    static async new() {
        const wasm = new index_js_3.BarretenbergWasmMain();
        const { module, threads } = await (0, index_js_5.fetchModuleAndThreads)(1);
        await wasm.init(module, threads);
        return new BarretenbergSync(wasm);
    }
    static initSingleton() {
        if (!barretenbergSyncSingletonPromise) {
            barretenbergSyncSingletonPromise = BarretenbergSync.new().then(s => (barretenbergSyncSingleton = s));
        }
        return barretenbergSyncSingletonPromise;
    }
    static getSingleton() {
        if (!barretenbergSyncSingleton) {
            throw new Error('First call BarretenbergSync.initSingleton() on @aztec/bb.js module.');
        }
        return barretenbergSyncSingleton;
    }
    getWasm() {
        return this.wasm;
    }
}
exports.BarretenbergSync = BarretenbergSync;
// If we're in ESM environment, use top level await. CJS users need to call it manually.
// Need to ignore for cjs build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxxQ0FBZ0M7QUFDaEMsMkRBQW9GO0FBQ3BGLGdHQUFxRztBQUNyRyxtRkFBd0g7QUFDeEgsb0VBQWtGO0FBQ2xGLDREQUE4RjtBQUM5RiwwREFBZ0M7QUFDaEMsOENBQXNDO0FBQ3RDLDBEQUFtRDtBQUVuRCw2Q0FBcUQ7QUFBNUMsbUhBQUEsb0JBQW9CLE9BQUE7QUFDN0IsMkNBQW1FO0FBQTFELCtHQUFBLGlCQUFpQixPQUFBO0FBQUUsOEdBQUEsZ0JBQWdCLE9BQUE7QUFFNUMsTUFBTSxLQUFLLEdBQUcsSUFBQSxlQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7QUFheEM7OztHQUdHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsMEJBQWU7SUFHL0MsWUFBNEIsTUFBVyxFQUFFLElBQTRCLEVBQUUsT0FBdUI7UUFDNUYsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRGMsV0FBTSxHQUFOLE1BQU0sQ0FBSztRQUVyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUEwQixFQUFFO1FBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEdBQUUsQ0FBQztRQUNsQyxNQUFNLElBQUksR0FBRyxJQUFBLG9DQUF5QixFQUE2QixNQUFNLENBQUMsQ0FBQztRQUMzRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sSUFBQSxnQ0FBcUIsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBQSxlQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRyxPQUFPLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhO1FBQ2pCLE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUMsV0FBbUI7UUFDN0MsTUFBTSxHQUFHLEdBQUcsTUFBTSxjQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLHlCQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLHlCQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2RyxDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFvQixFQUFFLGFBQXNCO1FBQzVELDZEQUE2RDtRQUM3RCxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDL0YsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUExQ0Qsb0NBMENDO0FBRUQsSUFBSSx5QkFBMkMsQ0FBQztBQUNoRCxJQUFJLGdDQUEyRCxDQUFDO0FBRWhFLE1BQWEsZ0JBQWlCLFNBQVEsOEJBQW1CO0lBQ3ZELFlBQW9CLElBQTBCO1FBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUc7UUFDZCxNQUFNLElBQUksR0FBRyxJQUFJLCtCQUFvQixFQUFFLENBQUM7UUFDeEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLElBQUEsZ0NBQXFCLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxPQUFPLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELE1BQU0sQ0FBQyxhQUFhO1FBQ2xCLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1lBQ3RDLGdDQUFnQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMseUJBQXlCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBQ0QsT0FBTyxnQ0FBZ0MsQ0FBQztJQUMxQyxDQUFDO0lBRUQsTUFBTSxDQUFDLFlBQVk7UUFDakIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFDRCxPQUFPLHlCQUF5QixDQUFDO0lBQ25DLENBQUM7SUFFRCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQTdCRCw0Q0E2QkM7QUFFRCx3RkFBd0Y7QUFDeEYsZ0NBQWdDO0FBQ2hDLDZEQUE2RDtBQUM3RCxhQUFhO0FBQ2IsTUFBTSxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QiJ9