/// <reference types="jest" />
import fs from "fs";
import path from "path";

describe("dashboard.controller source", () => {
    test("contains calculateDashboardStats and formatRecentSessions helpers", () => {
        const file = path.join(`${process.platform === 'win32' ? '' : '/'}${/file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]}`, "..", "controller", "dashboard.controller.ts");
        const src = fs.readFileSync(file, "utf8");
        expect(src).toEqual(expect.stringMatching(/function calculateDashboardStats\(/));
        expect(src).toEqual(expect.stringMatching(/function formatRecentSessions\(/));
    });
});

