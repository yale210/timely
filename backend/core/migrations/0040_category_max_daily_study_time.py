import django.core.validators
from django.db import migrations, models


def add_max_daily_study_time_if_missing(apps, schema_editor):
    Category = apps.get_model("core", "Category")
    table_name = Category._meta.db_table

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    if "max_daily_study_time" in existing_columns:
        return

    field = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        validators=[
            django.core.validators.MinValueValidator(0),
            django.core.validators.MaxValueValidator(1440),
        ],
    )
    field.set_attributes_from_name("max_daily_study_time")
    schema_editor.add_field(Category, field)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0039_merge_20260325_1358"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_max_daily_study_time_if_missing,
                    migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="category",
                    name="max_daily_study_time",
                    field=models.PositiveSmallIntegerField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(1440),
                        ],
                    ),
                ),
            ],
        ),
    ]
