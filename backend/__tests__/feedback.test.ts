/// <reference types="jest" />
import fs from "fs";
import path from "path";

describe("feedback.controller source", () => {
    test("exports getUnifiedSessionFeedback and generateAIFeedback", () => {
        const file = path.join(__dirname, "..", "controller", "feedback.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/getUnifiedSessionFeedback/));
        expect(src).toEqual(expect.stringMatching(/generateAIFeedback/));
    });
});

