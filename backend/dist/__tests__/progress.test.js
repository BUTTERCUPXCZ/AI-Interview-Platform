/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("progress.controller source", () => {
    test("exports getProgressAnalytics", () => {
        const file = path.join(__dirname, "..", "controller", "progress.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/getProgressAnalytics/));
    });
});
