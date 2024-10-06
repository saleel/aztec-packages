"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRustCode = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const mappings_js_1 = require("./mappings.js");
function generateRustCode(filename) {
    const fileContent = fs_1.default.readFileSync(filename, 'utf-8');
    const functionDeclarations = JSON.parse(fileContent);
    let output = `
// WARNING: FILE CODE GENERATED BY BINDGEN UTILITY. DO NOT EDIT!
use crate::call_wasm_export::call_wasm_export;
use crate::serialize::{BufferDeserializer, NumberDeserializer, VectorDeserializer, BoolDeserializer};
use crate::types::{Fr, Fq, Point, Buffer32, Buffer128};
`;
    for (const { functionName, inArgs, outArgs } of functionDeclarations) {
        const parameters = inArgs.map(({ name, type }) => `${name}: ${(0, mappings_js_1.mapRustType)(type)}`).join(', ');
        const inArgsVar = `let in_args = vec![${inArgs.map(arg => arg.name).join(', ')}];`;
        const outTypesVar = `let out_types = vec![${outArgs.map(arg => (0, mappings_js_1.mapDeserializer)(arg.type)).join(', ')}];`;
        const wasmCall = `let result = call_wasm_export(&"${functionName}", &in_args, &out_types)?;`;
        const returnStmt = getReturnStmt(outArgs);
        const returnType = outArgs.length === 0
            ? '-> Result<(), Box<dyn std::error::Error>>'
            : `-> Result<(${outArgs.map(a => (0, mappings_js_1.mapRustType)(a.type)).join(', ')}), Box<dyn std::error::Error>>`;
        const functionDecl = `
pub fn ${functionName}(${parameters})${returnType} {
    ${inArgsVar}
    ${outTypesVar}
    ${wasmCall}
    ${returnStmt}
}
`;
        output += functionDecl;
    }
    return output;
}
exports.generateRustCode = generateRustCode;
function getReturnStmt(outArgs) {
    switch (outArgs.length) {
        case 0:
            return 'Ok(())';
        case 1:
            return `Ok(result[0].clone())`;
        default:
            return `Ok((${outArgs.map((_, idx) => `result[${idx}].clone()`).join(', ')}))`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaW5kZ2VuL3J1c3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLG9EQUFvQjtBQUVwQiwrQ0FBNkQ7QUFFN0QsU0FBZ0IsZ0JBQWdCLENBQUMsUUFBZ0I7SUFDL0MsTUFBTSxXQUFXLEdBQUcsWUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxvQkFBb0IsR0FBMEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUU1RSxJQUFJLE1BQU0sR0FBRzs7Ozs7Q0FLZCxDQUFDO0lBRUEsS0FBSyxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1FBQ3JFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLEtBQUssSUFBQSx5QkFBVyxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUYsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbkYsTUFBTSxXQUFXLEdBQUcsd0JBQXdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDZCQUFlLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDekcsTUFBTSxRQUFRLEdBQUcsbUNBQW1DLFlBQVksNEJBQTRCLENBQUM7UUFFN0YsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sVUFBVSxHQUNkLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUNsQixDQUFDLENBQUMsMkNBQTJDO1lBQzdDLENBQUMsQ0FBQyxjQUFjLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHlCQUFXLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQztRQUVyRyxNQUFNLFlBQVksR0FBRztTQUNoQixZQUFZLElBQUksVUFBVSxJQUFJLFVBQVU7TUFDM0MsU0FBUztNQUNULFdBQVc7TUFDWCxRQUFRO01BQ1IsVUFBVTs7Q0FFZixDQUFDO1FBRUUsTUFBTSxJQUFJLFlBQVksQ0FBQztJQUN6QixDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQXBDRCw0Q0FvQ0M7QUFFRCxTQUFTLGFBQWEsQ0FBQyxPQUFjO0lBQ25DLFFBQVEsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLEtBQUssQ0FBQztZQUNKLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLEtBQUssQ0FBQztZQUNKLE9BQU8sdUJBQXVCLENBQUM7UUFDakM7WUFDRSxPQUFPLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuRixDQUFDO0FBQ0gsQ0FBQyJ9