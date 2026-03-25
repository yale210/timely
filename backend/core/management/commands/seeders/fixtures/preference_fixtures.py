"""Fixture data for seeding the database."""

preferences = [
    {
        "model": "core.preference",
        "pk": 1,
        "fields": {
            "user": 1,
            "day_end": "22:00:01",
            "day_start": "08:57:02",
            "days_off": [1, 2, 3],
            "timezone": "Europe/London",
        },
    },
    {
        "model": "core.preference",
        "pk": 2,
        "fields": {
            "user": 2,
            "day_end": "02:00:01",
            "day_start": "05:57:02",
            "days_off": [1],
            "timezone": "Europe/London",
        },
    },
    {
        "model": "core.preference",
        "pk": 3,
        "fields": {
            "user": 3,
            "day_end": "23:00:00",
            "day_start": "12:53:05",
            "days_off": [2],
            "timezone": "Europe/London",
        },
    },
    {
        "model": "core.preference",
        "pk": 4,
        "fields": {
            "user": 4,
            "day_end": "21:00:01",
            "day_start": "03:11:02",
            "days_off": [6, 7],
            "timezone": "Europe/London",
        },
    },
    {
        "model": "core.preference",
        "pk": 5,
        "fields": {
            "user": 5,
            "day_end": "15:00:10",
            "day_start": "03:18:00",
            "days_off": [3],
            "timezone": "Europe/London",
        },
    },
]
