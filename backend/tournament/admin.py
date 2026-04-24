from django.contrib import admin
from .models import Tournament, Team, Player, Match, Standing

admin.site.register(Tournament)
admin.site.register(Team)
admin.site.register(Player)
admin.site.register(Match)
admin.site.register(Standing)
