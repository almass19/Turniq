from django.db import models
from django.contrib.auth.models import User


class Tournament(models.Model):
    FORMAT_CHOICES = [
        ("round-robin", "Round Robin"),
        ("single-elimination", "Single Elimination"),
    ]

    name = models.CharField(max_length=200)
    sport = models.CharField(max_length=100)
    format = models.CharField(max_length=50, choices=FORMAT_CHOICES, default="round-robin")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tournaments")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Team(models.Model):
    name = models.CharField(max_length=200)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="teams")

    class Meta:
        unique_together = ("name", "tournament")

    def __str__(self):
        return f"{self.name} ({self.tournament.name})"


class Player(models.Model):
    name = models.CharField(max_length=200)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    number = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.name


class Match(models.Model):
    STATUS_CHOICES = [
        ("tbd", "TBD"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
    ]

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="matches")
    home_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="home_matches")
    away_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="away_matches")
    home_score = models.PositiveIntegerField(null=True, blank=True)
    away_score = models.PositiveIntegerField(null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    round_number = models.PositiveIntegerField(default=1)
    bracket_position = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        home = self.home_team.name if self.home_team else "TBD"
        away = self.away_team.name if self.away_team else "TBD"
        return f"{home} vs {away}"


class Standing(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="standings")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="standings")
    played = models.PositiveIntegerField(default=0)
    wins = models.PositiveIntegerField(default=0)
    draws = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    goals_for = models.PositiveIntegerField(default=0)
    goals_against = models.PositiveIntegerField(default=0)

    @property
    def points(self):
        return self.wins * 3 + self.draws

    @property
    def goal_diff(self):
        return self.goals_for - self.goals_against

    class Meta:
        unique_together = ("tournament", "team")

    def __str__(self):
        return f"{self.team.name} - {self.tournament.name}"
