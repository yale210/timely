from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0023_task_allow_split"),
    ]

    operations = [
        migrations.AlterField(
            model_name="specialdates",
            name="text",
            field=models.CharField(blank=True, max_length=250),
        ),
    ]
