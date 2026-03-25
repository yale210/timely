"""Fixture data for seeding the database."""

commutes = [
    {
        "model": "core.commute",
        "pk": 1,
        "fields": {"user": 1, "commute_start": "00:00", "commute_end": "01:00"},
    },
    {
        "model": "core.commute",
        "pk": 2,
        "fields": {"user": 1, "commute_start": "08:00", "commute_end": "09:15"},
    },
    {
        "model": "core.commute",
        "pk": 3,
        "fields": {"user": 2, "commute_start": "10:00", "commute_end": "11:30"},
    },
    {
        "model": "core.commute",
        "pk": 4,
        "fields": {"user": 3, "commute_start": "10:00", "commute_end": "11:30"},
    },
    {
        "model": "core.commute",
        "pk": 5,
        "fields": {"user": 4, "commute_start": "00:00", "commute_end": "00:05"},
    },
    {
        "model": "core.commute",
        "pk": 6,
        "fields": {"user": 4, "commute_start": "08:12", "commute_end": "12:39"},
    },
    {
        "model": "core.commute",
        "pk": 7,
        "fields": {"user": 4, "commute_start": "13:00", "commute_end": "14:00"},
    },
]
