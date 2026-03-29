"""Fixture data for seeding the database."""

users = [
    {
        "model": "authentication.user",
        "fields": {
            "username": "thomas",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "thomas@example.com",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        },
    },
    {
        "model": "authentication.user",
        "fields": {
            "username": "david",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "david@example.com",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
        },
    },
    {
        "model": "authentication.user",
        "fields": {
            "username": "tommy",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "test@example.com",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
        },
    },
    {
        "model": "authentication.user",
        "fields": {
            "username": "mark",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "bob@example.com",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
        },
    },
    {
        "model": "authentication.user",
        "fields": {
            "username": "patrick",
            "password": "pbkdf2_sha256$1000000$x7OkUUpZ0jz1bkch9G2uXN$6HNY4kQaCjyiH4hc+765D1MYlAXsECbVP1G9VM0Bpg8=",
            "email": "simon@example.com",
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
        },
    },
]
