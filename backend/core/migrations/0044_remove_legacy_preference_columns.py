from django.db import migrations


LEGACY_PREFERENCE_COLUMNS = (
    "compact_mode",
    "default_landing_page",
    "week_starts_on",
    "time_format",
)


def drop_legacy_preference_columns(apps, schema_editor):
    table_name = "core_preference"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

        for column_name in LEGACY_PREFERENCE_COLUMNS:
            if column_name not in existing_columns:
                continue
            cursor.execute(
                f'ALTER TABLE "{table_name}" DROP COLUMN "{column_name}"'
            )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0043_delete_profile"),
    ]

    operations = [
        migrations.RunPython(
            drop_legacy_preference_columns,
            migrations.RunPython.noop,
        ),
    ]
