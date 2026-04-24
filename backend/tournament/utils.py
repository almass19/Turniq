import math
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
        matches.append(
            Match(
                tournament=tournament,
                home_team=home,
                away_team=away,
                date=base_date + timedelta(days=i * 3),
                round_number=i + 1,
            )
        )
    Match.objects.bulk_create(matches)


def generate_single_elimination(tournament):
    teams = list(tournament.teams.all())
    n = len(teams)
    if n < 2:
        return

    # Pad to next power of 2 with None (byes)
    size = 1
    while size < n:
        size *= 2
    slots = teams + [None] * (size - n)

    total_rounds = int(math.log2(size))
    base_date = datetime.now().replace(hour=15, minute=0, second=0, microsecond=0)

    # Round 1 — real teams (byes auto-advance)
    r1_matches = []
    for pos in range(size // 2):
        home = slots[pos * 2]
        away = slots[pos * 2 + 1]

        if home is None and away is None:
            continue

        # One team gets a bye — mark as completed, winner advances
        if home is None or away is None:
            winner = home or away
            m = Match(
                tournament=tournament,
                home_team=winner,
                away_team=None,
                round_number=1,
                bracket_position=pos,
                status="completed",
                home_score=1,
                away_score=0,
            )
            r1_matches.append((m, winner, pos))
            continue

        m = Match(
            tournament=tournament,
            home_team=home,
            away_team=away,
            date=base_date,
            round_number=1,
            bracket_position=pos,
            status="scheduled",
        )
        r1_matches.append((m, None, pos))

    created_r1 = []
    for m, bye_winner, pos in r1_matches:
        m.save()
        created_r1.append((m, bye_winner, pos))

    # Create placeholder matches for rounds 2+
    for r in range(2, total_rounds + 1):
        n_matches = size // (2 ** r)
        date = base_date + timedelta(days=(r - 1) * 7)
        for pos in range(n_matches):
            Match.objects.create(
                tournament=tournament,
                home_team=None,
                away_team=None,
                date=date,
                round_number=r,
                bracket_position=pos,
                status="tbd",
            )

    # Advance bye winners into round 2
    for m, bye_winner, pos in created_r1:
        if bye_winner:
            _advance_winner_to_next(tournament, round_number=1, bracket_position=pos, winner=bye_winner)


def _advance_winner_to_next(tournament, round_number, bracket_position, winner):
    next_round = round_number + 1
    next_pos = bracket_position // 2
    try:
        next_match = Match.objects.get(
            tournament=tournament,
            round_number=next_round,
            bracket_position=next_pos,
        )
        if bracket_position % 2 == 0:
            next_match.home_team = winner
        else:
            next_match.away_team = winner

        if next_match.home_team and next_match.away_team:
            next_match.status = "scheduled"
        next_match.save()
    except Match.DoesNotExist:
        pass


def advance_elimination_winner(match):
    winner = match.home_team if match.home_score > match.away_score else match.away_team
    if winner:
        _advance_winner_to_next(match.tournament, match.round_number, match.bracket_position, winner)


def get_round_name(round_number, total_rounds):
    rounds_from_end = total_rounds - round_number
    if rounds_from_end == 0:
        return "Final"
    if rounds_from_end == 1:
        return "Semi-Final"
    if rounds_from_end == 2:
        return "Quarter-Final"
    return f"Round {round_number}"


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
        home_team__isnull=False,
        away_team__isnull=False,
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
