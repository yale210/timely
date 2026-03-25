from django.db import migrations, models


def remove_assessment_fields_if_present(apps, schema_editor):
    Assessment = apps.get_model("core", "Assessment")
    table_name = Assessment._meta.db_table
    removable_columns = {"end_time", "location", "start_time"}

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    for field_name in sorted(removable_columns & existing_columns):
        field = Assessment._meta.get_field(field_name)
        schema_editor.remove_field(Assessment, field)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0041_merge_20260325_1523"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    remove_assessment_fields_if_present,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="assessment",
                    name="end_time",
                ),
                migrations.RemoveField(
                    model_name="assessment",
                    name="location",
                ),
                migrations.RemoveField(
                    model_name="assessment",
                    name="start_time",
                ),
            ],
        ),
    ]
