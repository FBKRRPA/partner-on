from django.db import migrations
import accounts.models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.AlterModelManagers(
            name="user",
            managers=[("objects", accounts.models.PartneronUserManager())],
        ),
    ]
