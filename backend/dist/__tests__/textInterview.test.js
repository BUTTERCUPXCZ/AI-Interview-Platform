/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("textInterview.controller source", () => {
    test("exports startTextInterview and getNextQuestion", () => {
        const file = path.join(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)[1]}`, "..", "controller", "textInterview.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/startTextInterview/));
        expect(src).toEqual(expect.stringMatching(/getNextQuestion/));
    });
});
