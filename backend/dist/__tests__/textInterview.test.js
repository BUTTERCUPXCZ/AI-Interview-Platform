/// <reference types="jest" />
import fs from "fs";
import path from "path";
describe("textInterview.controller source", () => {
    test("exports startTextInterview and getNextQuestion", () => {
        const file = path.join(__dirname, "..", "controller", "textInterview.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/startTextInterview/));
        expect(src).toEqual(expect.stringMatching(/getNextQuestion/));
    });
});
