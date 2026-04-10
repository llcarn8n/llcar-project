from django.contrib import admin
from .models import QtpPacket, AccelWindow, Ecu7e8, AudioWindow


@admin.register(QtpPacket)
class QtpPacketAdmin(admin.ModelAdmin):
    list_display = ['time', 'packet_id', 'client_hash', 'device_battery', 'acceleration_state']
    list_filter = ['acceleration_state', 'season']
    search_fields = ['client_hash']


@admin.register(Ecu7e8)
class Ecu7e8Admin(admin.ModelAdmin):
    list_display = ['time', 'packet_id', 'p010c', 'p010d', 'p0105', 'p0111']
    search_fields = ['client_hash']
