"""Fixture data for seeding the database."""

preferences = [
    {
        "model": "core.preference",
        "fields": {
            "user": "thomas",
            "day_end": "22:00:01",
            "day_start": "08:57:02",
            "days_off": [1, 2, 3],
            "timezone": "Europe/London",
            "max_hours_study_per_day": 10,
        },
    },
    {
        "model": "core.preference",
        "fields": {
            "user": "david",
            "day_end": "22:00:01",
            "day_start": "05:57:02",
            "days_off": [1],
            "timezone": "Europe/London",
            "max_hours_study_per_day": 24,
        },
    },
    {
        "model": "core.preference",
        "fields": {
            "user": "tommy",
            "day_end": "23:00:00",
            "day_start": "12:53:05",
            "days_off": [2],
            "timezone": "Europe/London",
            "max_hours_study_per_day": 7,
        },
    },
    {
        "model": "core.preference",
        "fields": {
            "user": "mark",
            "day_end": "21:00:01",
            "day_start": "03:11:02",
            "days_off": [6, 7],
            "timezone": "Europe/London",
            "max_hours_study_per_day": 6,
        },
    },
    {
        "model": "core.preference",
        "fields": {
            "user": "patrick",
            "day_end": "15:00:10",
            "day_start": "03:18:00",
            "days_off": [3],
            "timezone": "Europe/London",
            "max_hours_study_per_day": 7,
        },
    },
]
