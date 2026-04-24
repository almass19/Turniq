from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("tournaments/", views.TournamentListCreateView.as_view(), name="tournament-list"),
    path("tournaments/<int:pk>/", views.TournamentDetailView.as_view(), name="tournament-detail"),
    path("tournaments/<int:tournament_id>/teams/", views.add_team, name="add-team"),
    path("tournaments/<int:tournament_id>/teams/list/", views.teams_list, name="teams-list"),
    path("tournaments/<int:tournament_id>/generate-schedule/", views.generate_schedule, name="generate-schedule"),
    path("tournaments/<int:tournament_id>/standings/", views.standings, name="standings"),
    path("tournaments/<int:tournament_id>/schedule/", views.schedule, name="schedule"),
    path("matches/<int:match_id>/result/", views.enter_result, name="enter-result"),
]
