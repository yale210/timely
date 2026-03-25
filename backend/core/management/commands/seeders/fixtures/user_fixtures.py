"""Fixture data for seeding the database."""

users = [
    {
        "model": "auth.user",
        "pk": 1,
        "fields": {
            "username": "thomas",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "thomas@example.com",
            "first_name": "Thomas",
            "last_name": "Yale",
        },
    },
    {
        "model": "auth.user",
        "pk": 2,
        "fields": {
            "username": "david",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "david@example.com",
            "first_name": "David",
            "last_name": "Dudun",
        },
    },
    {
        "model": "auth.user",
        "pk": 3,
        "fields": {
            "username": "tommy",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "test@example.com",
            "first_name": "Tommy",
            "last_name": "Hoang",
        },
    },
    {
        "model": "auth.user",
        "pk": 4,
        "fields": {
            "username": "mark",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "bob@example.com",
            "first_name": "Mark",
            "last_name": "Bual",
        },
    },
    {
        "model": "auth.user",
        "pk": 5,
        "fields": {
            "username": "patrick",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "simon@example.com",
            "first_name": "Patrick",
            "last_name": "Beckwith",
        },
    },
]
