"""DiagnosticPipeline — orchestrator that ties the full diagnostic cycle together.

Pipeline steps:
  1. normalize_packet(raw_data) → NormalizedPacket
  2. extract_features(packet) → features dict
  3. Collect numeric features + OBD values into baseline_features
  4. baselines.update(regime, baseline_features)
  5. fact_generator.generate(packet, features) → List[Fact]
  6. Return result dict with packet, features, facts, tier, regime, baseline state
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from .baseline_store import BaselineStore
from .diagnosis_builder import DiagnosisBuilder
from .facts import Fact, FactGenerator
from .feature_extractor import extract_features
from .fuel_trim_analyzer import FuelTrimAnalyzer
from .knowledge_base import KnowledgeBase
from .normalizer import DrivingRegime, NormalizedPacket, normalize_packet
from .rule_engine import RuleEngine
from .vehicle_profile import VehicleProfile


# OBD fields to feed into baselines alongside extracted features
_OBD_BASELINE_FIELDS = ("rpm", "speed", "coolant_temp", "voltage")

# Feature keys that are numeric and suitable for baseline tracking
_NUMERIC_FEATURE_KEYS = (
    "total_vibration",
    "crest_factor_x", "crest_factor_y", "crest_factor_z",
    "shape_ratio_x", "shape_ratio_y", "shape_ratio_z",
    "ax_range", "ay_range", "az_range",
    "ltft_abs",
    "fuel_trim_delta",
    "vibration_speed_ratio",
)


class DiagnosticPipeline:
    """Full diagnostic cycle: raw data → normalize → features → baselines → facts.

    Args:
        vehicle_profile: Vehicle identity and correction factors.
        dtc_index_path:  Path to DTC index JSON (optional, default sample).
        situations_path: Path to situations JSON (optional, default sample).
        baselines:       External BaselineStore instance (optional, creates new if None).
    """

    def __init__(
        self,
        vehicle_profile: VehicleProfile,
        dtc_index_path: Optional[str] = None,
        situations_path: Optional[str] = None,
        baselines: Optional[BaselineStore] = None,
    ) -> None:
        # Knowledge base
        if dtc_index_path is not None and situations_path is not None:
            self._kb = KnowledgeBase(dtc_index_path, situations_path)
        else:
            # Allow construction without KB paths for minimal usage
            import os
            data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
            self._kb = KnowledgeBase(
                os.path.join(data_dir, "dtc-index-sample.json"),
                os.path.join(data_dir, "situations-sample.json"),
            )

        # Baseline store
        self.baselines: BaselineStore = baselines if baselines is not None else BaselineStore()

        # Fact generator
        self._fact_generator = FactGenerator(vehicle_profile, self._kb)
        self._profile = vehicle_profile

        # Plan 2 components: fuel-trim analysis, rule engine, diagnosis builder
        self._fuel_trim_analyzer = FuelTrimAnalyzer(vehicle_profile)
        self._rule_engine = RuleEngine()
        self._diagnosis_builder = DiagnosisBuilder(self._kb, vehicle_profile)

        # GAP-P2: Track previous regime for regime stability detection
        self._previous_regime: Optional[DrivingRegime] = None

    def process(self, raw_data: dict) -> Dict[str, Any]:
        """Process a single raw telemetry packet through the full diagnostic pipeline.

        Returns a dict with:
            packet:              NormalizedPacket
            features:            dict of extracted features
            facts:               List[Fact]
            tier:                str ('T1', 'T2', 'T3')
            regime:              str (driving regime value)
            baseline_ready:      bool (all key features have enough samples)
            baseline_confidence: float (0.0 to 1.0)
        """
        # Step 1: Normalize (pass previous_regime for GAP-P2 stability detection)
        packet: NormalizedPacket = normalize_packet(
            raw_data, previous_regime=self._previous_regime,
        )
        # Update previous regime for next call
        self._previous_regime = packet.regime

        # Step 2: Extract features
        features: Dict[str, Any] = extract_features(packet)

        # Step 3: Collect baseline features (numeric features + key OBD values)
        baseline_features: Dict[str, Any] = {}

        # Add numeric extracted features
        for key in _NUMERIC_FEATURE_KEYS:
            val = features.get(key)
            if val is not None and isinstance(val, (int, float)):
                baseline_features[key] = val

        # Add OBD values
        for obd_field in _OBD_BASELINE_FIELDS:
            val = getattr(packet, obd_field, None)
            if val is not None:
                baseline_features[obd_field] = val

        # Also add ltft_abs from features (already covered above) and
        # az_std, total_vibration directly from packet/features for KEY_FEATURES tracking
        az_std = getattr(packet, "az_std", None)
        if az_std is not None:
            baseline_features["az_std"] = az_std

        # Step 4: Update baselines
        regime_str = packet.regime.value
        self.baselines.update(packet.regime, baseline_features)

        # Step 5: Generate facts (pass baselines for z-score anomaly detection)
        facts: List[Fact] = self._fact_generator.generate(
            packet, features, baselines=self.baselines,
        )

        # Step 6: Build result
        return {
            "packet": packet,
            "features": features,
            "facts": facts,
            "tier": packet.tier,
            "regime": regime_str,
            "baseline_ready": self.baselines.is_ready(packet.regime),
            "baseline_confidence": self.baselines.confidence(packet.regime),
        }

    # ------------------------------------------------------------------
    # Full diagnosis cycle (Plan 2)
    # ------------------------------------------------------------------

    def full_diagnose(
        self, raw_data: dict, db_cursor=None, client_hash: str = None,
    ) -> Dict[str, Any]:
        """Run the complete diagnostic cycle and return a 7-block report.

        Steps:
          1. process(raw_data) → pipeline result (normalize → features → baselines → facts)
          2. FuelTrimAnalyzer.analyze() if LTFT data is present
          3. RuleEngine.run_all() against facts, features, baselines
          4. DiagnosisBuilder.build_report() → 7-block report

        If db_cursor and client_hash are provided:
          - Save baselines to DB after processing
          - Write facts to fact_log
          - Write anomaly scores to anomaly_scores

        Returns:
            Dict with keys: can_drive, health_scores, health_trends,
            diagnoses, fuel_loss, recalls, next_steps, confidence,
            baseline_status, rule_version.
        """
        # Step 1: existing pipeline processing
        pipeline_result = self.process(raw_data)
        packet: NormalizedPacket = pipeline_result["packet"]
        features: Dict[str, Any] = pipeline_result["features"]
        facts: List[Fact] = pipeline_result["facts"]

        # Step 2: Fuel trim analysis (only if LTFT data available)
        fuel_trim_result = None
        if packet.ltft_bank1 is not None:
            stft = packet.stft_bank1 if packet.stft_bank1 is not None else 0.0
            fuel_trim_result = self._fuel_trim_analyzer.analyze(
                ltft=packet.ltft_bank1,
                stft=stft,
                regime=packet.regime,
                coolant_temp=packet.coolant_temp,
                ambient_temp=packet.engine_context.ambient_temp,
            )

        # Step 3: Rule engine evaluation
        rule_results = self._rule_engine.run_all(
            facts=facts,
            features=features,
            baselines=self.baselines,
            regime=packet.regime,
            packet=packet,
        )

        # GAP-P2: Regime stability filter — during regime transitions, data is
        # unreliable. Reduce confidence by 50% for all rule results when regime
        # just changed. This prevents false positives from transient spikes
        # (e.g. brief deceleration triggering idle-regime rules).
        if not packet.regime_stable:
            for rr in rule_results:
                original = rr["confidence"]
                rr["confidence"] = round(original * 0.5, 1)
                # Recompute status based on reduced confidence
                c = rr["confidence"]
                if c >= 70:
                    rr["status"] = "likely"
                elif c >= 40:
                    rr["status"] = "possible"
                elif c > 0:
                    rr["status"] = "unlikely"
                else:
                    rr["status"] = "clear"

        # Step 4: Build diagnosis report
        report = self._diagnosis_builder.build_report(
            pipeline_result=pipeline_result,
            rule_results=rule_results,
            fuel_trim_result=fuel_trim_result,
            baseline_store=self.baselines,
        )

        # Step 5: Optional DB persistence
        if db_cursor is not None and client_hash is not None:
            from .db_writers import save_baselines, write_fact_log, write_anomaly_scores

            regime_str = packet.regime.value
            save_baselines(db_cursor, client_hash, self.baselines)
            write_fact_log(db_cursor, client_hash, facts, packet.tier)
            write_anomaly_scores(db_cursor, client_hash, report, features, regime_str)

        return report
