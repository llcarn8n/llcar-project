from django.db import models


class QtpPacket(models.Model):
    """Maps to existing qtp_packets TimescaleDB hypertable"""
    time = models.DateTimeField(primary_key=True)
    packet_id = models.BigIntegerField()
    client_hash = models.TextField(blank=True, null=True)
    geo_hash = models.CharField(max_length=8, blank=True, null=True)
    road_type = models.TextField(blank=True, null=True)
    season = models.TextField(blank=True, null=True)
    acceleration_state = models.TextField(blank=True, null=True)
    weather_temp = models.DecimalField(max_digits=4, decimal_places=1, null=True)
    weather_humidity = models.SmallIntegerField(null=True)
    weather_wind = models.DecimalField(max_digits=4, decimal_places=1, null=True)
    weather_condition = models.TextField(blank=True, null=True)
    device_battery = models.SmallIntegerField(null=True)
    device_charging = models.BooleanField(null=True)
    duration_ms = models.IntegerField(null=True)
    ecu_mask = models.SmallIntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'qtp_packets'
        ordering = ['-time']


class AccelWindow(models.Model):
    """Maps to existing accel_windows TimescaleDB hypertable.
    Values are QTP-encoded (0-255):
      Conversion: value_ms2 = (raw - 128) / 128.0 * 9.81
      Std dev:    value_ms2 = raw / 255.0 * 9.81
    """
    time = models.DateTimeField(primary_key=True)
    packet_id = models.BigIntegerField(null=True)
    client_hash = models.TextField(blank=True, null=True)
    window_index = models.SmallIntegerField(null=True)
    ax_min = models.SmallIntegerField(null=True)
    ax_max = models.SmallIntegerField(null=True)
    ax_avg = models.SmallIntegerField(null=True)
    ax_std = models.SmallIntegerField(null=True)
    ax_shape1 = models.SmallIntegerField(null=True)
    ax_shape2 = models.SmallIntegerField(null=True)
    ax_shape3 = models.SmallIntegerField(null=True)
    ax_shape4 = models.SmallIntegerField(null=True)
    ay_min = models.SmallIntegerField(null=True)
    ay_max = models.SmallIntegerField(null=True)
    ay_avg = models.SmallIntegerField(null=True)
    ay_std = models.SmallIntegerField(null=True)
    ay_shape1 = models.SmallIntegerField(null=True)
    ay_shape2 = models.SmallIntegerField(null=True)
    ay_shape3 = models.SmallIntegerField(null=True)
    ay_shape4 = models.SmallIntegerField(null=True)
    az_min = models.SmallIntegerField(null=True)
    az_max = models.SmallIntegerField(null=True)
    az_avg = models.SmallIntegerField(null=True)
    az_std = models.SmallIntegerField(null=True)
    az_shape1 = models.SmallIntegerField(null=True)
    az_shape2 = models.SmallIntegerField(null=True)
    az_shape3 = models.SmallIntegerField(null=True)
    az_shape4 = models.SmallIntegerField(null=True)

    class Meta:
        managed = False
        db_table = 'accel_windows'
        ordering = ['-time']

    @staticmethod
    def decode_avg(raw):
        """Convert QTP 0-255 to m/s²"""
        if raw is None:
            return 0.0
        return round((raw - 128) / 128.0 * 9.81, 3)

    @staticmethod
    def decode_std(raw):
        if raw is None:
            return 0.0
        return round(raw / 255.0 * 9.81, 3)


class Ecu7e8(models.Model):
    """Maps to existing ecu_7e8 TimescaleDB hypertable.
    PID columns store decoded OBD2 values directly.
    """
    time = models.DateTimeField(primary_key=True)
    packet_id = models.BigIntegerField(null=True)
    client_hash = models.TextField(blank=True, null=True)
    # Key PIDs
    p0103 = models.SmallIntegerField(null=True)  # Fuel system status
    p0104 = models.SmallIntegerField(null=True)  # Calculated engine load %
    p0105 = models.SmallIntegerField(null=True)  # Coolant temp (raw + offset)
    p0106 = models.SmallIntegerField(null=True)  # Short term fuel trim
    p0107 = models.SmallIntegerField(null=True)  # Long term fuel trim
    p010b = models.SmallIntegerField(null=True)  # Intake manifold pressure
    p010c = models.SmallIntegerField(null=True)  # RPM
    p010d = models.SmallIntegerField(null=True)  # Speed km/h
    p010e = models.SmallIntegerField(null=True)  # Timing advance
    p010f = models.SmallIntegerField(null=True)  # Intake air temp
    p0111 = models.SmallIntegerField(null=True)  # Throttle position %
    p011f = models.IntegerField(null=True)        # Run time since start
    p0121 = models.IntegerField(null=True)        # Distance with MIL
    p012f = models.SmallIntegerField(null=True)   # Fuel tank level %
    p0131 = models.IntegerField(null=True)        # Distance since codes cleared
    p0142 = models.SmallIntegerField(null=True)   # Control module voltage
    p0145 = models.SmallIntegerField(null=True)   # Relative throttle
    p0146 = models.SmallIntegerField(null=True)   # Ambient air temp
    p0147 = models.SmallIntegerField(null=True)   # Abs throttle B
    p014c = models.SmallIntegerField(null=True)   # Commanded throttle actuator
    p014d = models.IntegerField(null=True)        # Time with MIL on
    p0187 = models.SmallIntegerField(null=True)   # Fuel rail temp

    class Meta:
        managed = False
        db_table = 'ecu_7e8'
        ordering = ['-time']


class AudioWindow(models.Model):
    """Maps to existing audio_windows TimescaleDB hypertable"""
    time = models.DateTimeField(primary_key=True)
    packet_id = models.BigIntegerField(null=True)
    client_hash = models.TextField(blank=True, null=True)
    window_index = models.SmallIntegerField(null=True)
    freq_1 = models.SmallIntegerField(null=True)
    amp_1 = models.SmallIntegerField(null=True)
    freq_2 = models.SmallIntegerField(null=True)
    amp_2 = models.SmallIntegerField(null=True)
    freq_3 = models.SmallIntegerField(null=True)
    amp_3 = models.SmallIntegerField(null=True)
    freq_4 = models.SmallIntegerField(null=True)
    amp_4 = models.SmallIntegerField(null=True)
    freq_5 = models.SmallIntegerField(null=True)
    amp_5 = models.SmallIntegerField(null=True)
    quality = models.SmallIntegerField(null=True, default=50)

    class Meta:
        managed = False
        db_table = 'audio_windows'
        ordering = ['-time']
