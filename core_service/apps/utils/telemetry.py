import time
from django.db import connection

class MeraPaisaTelemetryMiddleware:
    """
    Elite startup-grade telemetry middleware that tracks execution time (latency) 
    and exact database SQL queries count for every REST API endpoint, logging 
    diagnostic metrics directly to the console in a clear styled format.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Capture start metrics
        start_time = time.time()
        initial_queries = len(connection.queries)

        # 2. Process request
        response = self.get_response(request)

        # 3. Capture end metrics and calculate delta
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        final_queries = len(connection.queries)
        queries_run = final_queries - initial_queries

        # 4. Print beautiful, high-visibility telemetry diagnostics in console
        path = request.path
        method = request.method
        
        # Color coding: Green/Yellow for fast, Red for slow (>250ms)
        status_color = "\033[92m" if duration < 100 else "\033[93m" if duration < 250 else "\033[91m"
        reset_color = "\033[0m"
        telemetry_tag = "\033[94m[TELEMETRY]\033[0m"

        print(f"{telemetry_tag} {method} {path} | completed in {status_color}{duration:.2f}ms{reset_color} | SQL Queries Executed: \033[95m{queries_run}\033[0m")

        return response
