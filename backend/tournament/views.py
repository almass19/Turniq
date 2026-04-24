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
from .permissions import IsOrganizerOrReadOnly
from .utils import generate_round_robin, recalculate_standings


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
        tournament = serializer.save(created_by=self.request.user)
        # Generate schedule if teams were added via bulk creation — handled separately.
        # Schedule is generated when teams are finalized via /generate-schedule/.


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

    if tournament.teams.count() < 2:
        return Response({"detail": "Need at least 2 teams."}, status=status.HTTP_400_BAD_REQUEST)

    generate_round_robin(tournament)
    return Response({"detail": "Schedule generated."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def enter_result(request, match_id):
    match = get_object_or_404(Match, pk=match_id)
    tournament = match.tournament
    if tournament.created_by != request.user:
        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

    home_score = request.data.get("home_score")
    away_score = request.data.get("away_score")

    if home_score is None or away_score is None:
        return Response({"detail": "home_score and away_score required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        match.home_score = int(home_score)
        match.away_score = int(away_score)
    except (ValueError, TypeError):
        return Response({"detail": "Scores must be integers."}, status=status.HTTP_400_BAD_REQUEST)

    match.status = "completed"
    match.save()
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
    serializer = StandingSerializer(sorted_standings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def schedule(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    matches = Match.objects.filter(tournament=tournament).select_related(
        "home_team", "away_team"
    ).order_by("round_number", "date")
    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def teams_list(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    teams = Team.objects.filter(tournament=tournament).prefetch_related("players")
    serializer = TeamSerializer(teams, many=True)
    return Response(serializer.data)
