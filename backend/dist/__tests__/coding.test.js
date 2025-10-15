/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("coding.controller source", () => {
    test("exports executeCode or evaluateCode", () => {
        const file = path.join(__dirname, "..", "controller", "coding.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/export const (executeCode|evaluateCode)/));
    });
});
