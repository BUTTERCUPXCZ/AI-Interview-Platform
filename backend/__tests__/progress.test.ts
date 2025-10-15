/// <reference types="jest" />
import fs from "fs";
import path from "path";

describe("progress.controller source", () => {
    test("exports getProgressAnalytics", () => {
        const file = path.join(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]}`, "..", "controller", "progress.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/getProgressAnalytics/));
    });
});

