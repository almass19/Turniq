from itertools import combinations
from datetime import datetime, timedelta
from .models import Match, Standing


def generate_round_robin(tournament):
    teams = list(tournament.teams.all())
    if len(teams) < 2:
        return

    pairs = list(combinations(teams, 2))
    base_date = datetime.now().replace(hour=15, minute=0, second=0, microsecond=0)

    matches = []
    for i, (home, away) in enumerate(pairs):
        match_date = base_date + timedelta(days=i * 3)
        matches.append(
            Match(
                tournament=tournament,
                home_team=home,
                away_team=away,
                date=match_date,
                round_number=i + 1,
            )
        )
    Match.objects.bulk_create(matches)


def recalculate_standings(tournament):
    teams = tournament.teams.all()

    Standing.objects.filter(tournament=tournament).delete()
    standings = {
        team.id: Standing(
            tournament=tournament,
            team=team,
            played=0, wins=0, draws=0, losses=0,
            goals_for=0, goals_against=0,
        )
        for team in teams
    }

    completed_matches = tournament.matches.filter(
        status="completed",
        home_score__isnull=False,
        away_score__isnull=False,
    )

    for match in completed_matches:
        home = standings.get(match.home_team_id)
        away = standings.get(match.away_team_id)
        if not home or not away:
            continue

        hs, as_ = match.home_score, match.away_score
        home.played += 1
        away.played += 1
        home.goals_for += hs
        home.goals_against += as_
        away.goals_for += as_
        away.goals_against += hs

        if hs > as_:
            home.wins += 1
            away.losses += 1
        elif hs < as_:
            away.wins += 1
            home.losses += 1
        else:
            home.draws += 1
            away.draws += 1

    Standing.objects.bulk_create(standings.values())
