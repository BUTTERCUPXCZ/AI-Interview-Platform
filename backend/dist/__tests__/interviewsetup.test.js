/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("interviewSetup.controller source", () => {
    test("exports createInterviewSession", () => {
        const file = path.join(__dirname, "..", "controller", "interviewSetup.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/createInterviewSession/));
    });
});
