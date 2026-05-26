from django.apps import AppConfig


class FinancesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.finances'

    def ready(self):
        import os
        # Only start scheduler daemon in the main execution thread under hot-reloading
        if os.environ.get('RUN_MAIN') == 'true':
            from apps.utils.scheduler import MeraPaisaBackgroundScheduler
            MeraPaisaBackgroundScheduler.start()
