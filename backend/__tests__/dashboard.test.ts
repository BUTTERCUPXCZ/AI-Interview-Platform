/// <reference types="jest" />
import fs from "fs";
import path from "path";

describe("dashboard.controller source", () => {
    test("contains calculateDashboardStats and formatRecentSessions helpers", () => {
        const file = path.join(__dirname, "..", "controller", "dashboard.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/function calculateDashboardStats\(/));
        expect(src).toEqual(expect.stringMatching(/function formatRecentSessions\(/));
    });
});

