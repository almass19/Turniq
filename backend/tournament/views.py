import math
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Tournament, Team, Match, Standing
from .serializers import (
    TournamentSerializer, TeamSerializer, MatchSerializer,
    StandingSerializer, UserSerializer,
)
from .utils import (
    generate_round_robin, generate_single_elimination,
    advance_elimination_winner, recalculate_standings, get_round_name,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TournamentListCreateView(generics.ListCreateAPIView):
    queryset = Tournament.objects.all().order_by("-created_at")
    serializer_class = TournamentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_team(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    if tournament.created_by != request.user:
        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    serializer = TeamSerializer(data=request.data)
    if serializer.is_valid():
        team = serializer.save(tournament=tournament)
        Standing.objects.get_or_create(tournament=tournament, team=team)
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_schedule(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    if tournament.created_by != request.user:
        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    if tournament.matches.exists():
        return Response({"detail": "Schedule already generated."}, status=status.HTTP_400_BAD_REQUEST)

    team_count = tournament.teams.count()
    if team_count < 2:
        return Response({"detail": "Need at least 2 teams."}, status=status.HTTP_400_BAD_REQUEST)

    if tournament.format == "single-elimination":
        generate_single_elimination(tournament)
    else:
        generate_round_robin(tournament)

    return Response({"detail": "Schedule generated."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def enter_result(request, match_id):
    match = get_object_or_404(Match, pk=match_id)
    tournament = match.tournament
    if tournament.created_by != request.user:
        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    if not match.home_team or not match.away_team:
        return Response({"detail": "Match is not ready yet."}, status=status.HTTP_400_BAD_REQUEST)

    home_score = request.data.get("home_score")
    away_score = request.data.get("away_score")

    if home_score is None or away_score is None:
        return Response({"detail": "home_score and away_score required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        match.home_score = int(home_score)
        match.away_score = int(away_score)
    except (ValueError, TypeError):
        return Response({"detail": "Scores must be integers."}, status=status.HTTP_400_BAD_REQUEST)

    if tournament.format == "single-elimination" and match.home_score == match.away_score:
        return Response({"detail": "Draws not allowed in elimination format."}, status=status.HTTP_400_BAD_REQUEST)

    match.status = "completed"
    match.save()

    if tournament.format == "single-elimination":
        advance_elimination_winner(match)
    else:
        recalculate_standings(tournament)

    return Response(MatchSerializer(match).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def standings(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    standing_list = Standing.objects.filter(tournament=tournament).select_related("team")
    sorted_standings = sorted(
        standing_list,
        key=lambda s: (-s.points, -s.goal_diff, -s.goals_for),
    )
    return Response(StandingSerializer(sorted_standings, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def schedule(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    matches = Match.objects.filter(tournament=tournament).select_related(
        "home_team", "away_team"
    ).order_by("round_number", "bracket_position", "date")
    return Response(MatchSerializer(matches, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def bracket(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    matches = Match.objects.filter(tournament=tournament).select_related(
        "home_team", "away_team"
    ).order_by("round_number", "bracket_position")

    total_rounds = matches.aggregate(
        max_round=__import__("django.db.models", fromlist=["Max"]).Max("round_number")
    )["max_round"] or 1

    rounds = []
    for r in range(1, total_rounds + 1):
        round_matches = [m for m in matches if m.round_number == r]
        rounds.append({
            "round": r,
            "name": get_round_name(r, total_rounds),
            "matches": MatchSerializer(round_matches, many=True).data,
        })

    return Response(rounds)


@api_view(["GET"])
@permission_classes([AllowAny])
def teams_list(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    teams = Team.objects.filter(tournament=tournament).prefetch_related("players")
    return Response(TeamSerializer(teams, many=True).data)
