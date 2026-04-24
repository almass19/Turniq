from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tournament, Team, Player, Match, Standing


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ("id", "name", "number")


class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ("id", "name", "players")


class MatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.SerializerMethodField()
    away_team_name = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = (
            "id", "home_team", "home_team_name",
            "away_team", "away_team_name",
            "home_score", "away_score",
            "date", "status", "round_number", "bracket_position",
        )

    def get_home_team_name(self, obj):
        return obj.home_team.name if obj.home_team else "TBD"

    def get_away_team_name(self, obj):
        return obj.away_team.name if obj.away_team else "TBD"


class StandingSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source="team.name", read_only=True)
    points = serializers.IntegerField(read_only=True)
    goal_diff = serializers.IntegerField(read_only=True)

    class Meta:
        model = Standing
        fields = (
            "id", "team", "team_name",
            "played", "wins", "draws", "losses",
            "goals_for", "goals_against",
            "goal_diff", "points",
        )


class TournamentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    teams_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = ("id", "name", "sport", "format", "created_by", "created_by_username", "teams_count", "created_at")
        read_only_fields = ("created_by", "created_at")

    def get_teams_count(self, obj):
        return obj.teams.count()
