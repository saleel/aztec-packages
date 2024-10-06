"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.killSelf = exports.threadLogger = exports.getNumCpu = exports.getRemoteBarretenbergWasm = exports.getSharedMemoryAvailable = void 0;
const comlink_1 = require("comlink");
function getSharedMemoryAvailable() {
    const globalScope = typeof window !== 'undefined' ? window : self;
    return typeof SharedArrayBuffer !== 'undefined' && globalScope.crossOriginIsolated;
}
exports.getSharedMemoryAvailable = getSharedMemoryAvailable;
function getRemoteBarretenbergWasm(worker) {
    return (0, comlink_1.wrap)(worker);
}
exports.getRemoteBarretenbergWasm = getRemoteBarretenbergWasm;
function getNumCpu() {
    return navigator.hardwareConcurrency;
}
exports.getNumCpu = getNumCpu;
function threadLogger() {
    return undefined;
}
exports.threadLogger = threadLogger;
function killSelf() {
    self.close();
}
exports.killSelf = killSelf;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYmFycmV0ZW5iZXJnX3dhc20vaGVscGVycy9icm93c2VyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUErQjtBQUUvQixTQUFnQix3QkFBd0I7SUFDdEMsTUFBTSxXQUFXLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNsRSxPQUFPLE9BQU8saUJBQWlCLEtBQUssV0FBVyxJQUFJLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQztBQUNyRixDQUFDO0FBSEQsNERBR0M7QUFFRCxTQUFnQix5QkFBeUIsQ0FBSSxNQUFjO0lBQ3pELE9BQU8sSUFBQSxjQUFJLEVBQUMsTUFBTSxDQUFNLENBQUM7QUFDM0IsQ0FBQztBQUZELDhEQUVDO0FBRUQsU0FBZ0IsU0FBUztJQUN2QixPQUFPLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztBQUN2QyxDQUFDO0FBRkQsOEJBRUM7QUFFRCxTQUFnQixZQUFZO0lBQzFCLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFGRCxvQ0FFQztBQUVELFNBQWdCLFFBQVE7SUFDdEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2YsQ0FBQztBQUZELDRCQUVDIn0=