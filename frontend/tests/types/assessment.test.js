"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
(0, vitest_1.describe)("assessment types", function () {
    (0, vitest_1.it)("restricts supported assessment type values", function () {
        var assessmentType = "EXAM";
        (0, vitest_1.expectTypeOf)(assessmentType).toMatchTypeOf();
    });
    (0, vitest_1.it)("defines assessment event details", function () {
        var eventDetails = {
            start_time: "2026-03-30T09:00:00Z",
            end_time: "2026-03-30T11:00:00Z",
            location: "Hall A",
        };
        (0, vitest_1.expectTypeOf)(eventDetails).toMatchTypeOf();
    });
    (0, vitest_1.it)("defines the assessment payload shapes", function () {
        var assessment = {
            id: 1,
            title: "Midterm",
            assessment_type: "EXAM",
            due_date: "2026-04-10",
            length_of_assessment: 120,
            weighting_of_assessment: 40,
            notes: "Closed book",
            reminder_offset: 60,
            assessment_category: { id: 1, text: "Exam" },
            module_category: { id: 2, text: "CS101" },
            categories: [{ id: 1, text: "Exam" }],
            completed: false,
            linked_event: 3,
            linked_event_details: null,
            created_at: "2026-03-30T09:00:00Z",
            updated_at: "2026-03-30T10:00:00Z",
        };
        var submission = {
            title: "Midterm",
            assessment_type: "EXAM",
            categories: [1],
            assessment_category: 1,
            module_category: 2,
            event_details: {
                start_time: "2026-04-10T09:00:00Z",
                end_time: "2026-04-10T11:00:00Z",
                location: "Hall A",
            },
        };
        (0, vitest_1.expectTypeOf)(assessment).toMatchTypeOf();
        (0, vitest_1.expectTypeOf)(submission).toMatchTypeOf();
    });
});
