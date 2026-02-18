from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0012_merge_20260217_1912"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name="Notification"),
                migrations.DeleteModel(name="PushSubscription"),
            ],
        ),
    ]
