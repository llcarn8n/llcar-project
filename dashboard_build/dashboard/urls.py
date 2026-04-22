from django.urls import path, re_path
from . import views
from .diagnostic.api_views import diagnose_view, diagnose_latest_view, feedback_view, history_view, correlations_view, shadow_metrics_view, recalls_search_view, kb_image

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('v2/', views.dashboard_v2, name='dashboard_v2'),
    path('api/data/', views.api_data, name='api_data'),
    path('api/stats/', views.api_stats, name='api_stats'),
    path('api/health/', views.api_health, name='api_health'),
    path('api/maintenance/', views.api_maintenance, name='api_maintenance'),
    path('api/trips/', views.api_trips, name='api_trips'),
    path('api/diagnostics/', views.api_diagnostics, name='api_diagnostics'),
    path('api/anomaly/', views.api_anomaly, name='api_anomaly'),
    path('api/anomaly/history/', views.api_anomaly_history, name='api_anomaly_history'),
    path('api/v2/diagnose/', diagnose_view, name='api_v2_diagnose'),
    path('api/v2/correlations/', correlations_view, name='api_v2_correlations'),
    path('api/v2/diagnose-latest/', diagnose_latest_view, name='api_v2_diagnose_latest'),
    path('api/v2/feedback/', feedback_view, name='api_v2_feedback'),
    path('api/v2/history/', history_view, name='api_v2_history'),
    path('api/diagnostics/shadow-metrics/', shadow_metrics_view, name='shadow_metrics'),
    path('api/v2/recalls-search/', recalls_search_view, name='api_v2_recalls_search'),
    path('landing/', views.landing, name='landing'),
    re_path(r'^api/kb-image/(?P<hash>[0-9a-f]{64})(?:\.webp)?/?$', kb_image, name='kb_image'),
    re_path(r'^v3/s/(?P<path>.+)$', views.serve_spa_static_gzip, name='spa_static'),
    re_path(r'^v3/d/(?P<path>.+)$', views.serve_spa_data, name='spa_data'),
    re_path(r'^v3/.*$', views.dashboard_v3, name='dashboard_v3'),
]
