/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("interviewSetup.controller source", () => {
    test("exports createInterviewSession", () => {
        const file = path.join(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)[1]}`, "..", "controller", "interviewSetup.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/createInterviewSession/));
    });
});
