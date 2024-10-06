import { proxy } from 'comlink';
import { BarretenbergApi, BarretenbergApiSync } from '../barretenberg_api/index.js';
import { createMainWorker } from '../barretenberg_wasm/barretenberg_wasm_main/factory/node/index.js';
import { BarretenbergWasmMain } from '../barretenberg_wasm/barretenberg_wasm_main/index.js';
import { getRemoteBarretenbergWasm } from '../barretenberg_wasm/helpers/index.js';
import { fetchModuleAndThreads } from '../barretenberg_wasm/index.js';
import createDebug from 'debug';
import { Crs } from '../crs/index.js';
import { RawBuffer } from '../types/raw_buffer.js';
export { BarretenbergVerifier } from './verifier.js';
export { UltraPlonkBackend, UltraHonkBackend } from './backend.js';
const debug = createDebug('bb.js:wasm');
/**
 * The main class library consumers interact with.
 * It extends the generated api, and provides a static constructor "new" to compose components.
 */
export class Barretenberg extends BarretenbergApi {
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
        const worker = createMainWorker();
        const wasm = getRemoteBarretenbergWasm(worker);
        const { module, threads } = await fetchModuleAndThreads(options.threads);
        await wasm.init(module, threads, proxy(debug), options.memory?.initial, options.memory?.maximum);
        return new Barretenberg(worker, wasm, options);
    }
    async getNumThreads() {
        return await this.wasm.getNumThreads();
    }
    async initSRSForCircuitSize(circuitSize) {
        const crs = await Crs.new(circuitSize + Math.floor((circuitSize * 6) / 10) + 1, this.options.crsPath);
        await this.commonInitSlabAllocator(circuitSize);
        await this.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
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
let barretenbergSyncSingleton;
let barretenbergSyncSingletonPromise;
export class BarretenbergSync extends BarretenbergApiSync {
    constructor(wasm) {
        super(wasm);
    }
    static async new() {
        const wasm = new BarretenbergWasmMain();
        const { module, threads } = await fetchModuleAndThreads(1);
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
// If we're in ESM environment, use top level await. CJS users need to call it manually.
// Need to ignore for cjs build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
await BarretenbergSync.initSingleton(); // POSTPROCESS ESM ONLY
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDaEMsT0FBTyxFQUFFLGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3BGLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG1FQUFtRSxDQUFDO0FBQ3JHLE9BQU8sRUFBRSxvQkFBb0IsRUFBOEIsTUFBTSxzREFBc0QsQ0FBQztBQUN4SCxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQUNsRixPQUFPLEVBQTBCLHFCQUFxQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDOUYsT0FBTyxXQUFXLE1BQU0sT0FBTyxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN0QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFFbkQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3JELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUVuRSxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFheEM7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLFlBQWEsU0FBUSxlQUFlO0lBRy9DLFlBQTRCLE1BQVcsRUFBRSxJQUE0QixFQUFFLE9BQXVCO1FBQzVGLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURjLFdBQU0sR0FBTixNQUFNLENBQUs7UUFFckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBMEIsRUFB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