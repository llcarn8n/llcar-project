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
from .fuel_trim_analyzer import DualRegimeResult, FuelTrimAnalyzer
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
    "vibration_freq_ratio",
    "vertical_lateral_ratio",
    "audio_energy_band_120_180",
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
            import os
            data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
            dtc_full = os.path.join(data_dir, "dtc-index.json")
            dtc_sample = os.path.join(data_dir, "dtc-index-sample.json")
            sit_full = os.path.join(data_dir, "situations-universal.json")
            sit_sample = os.path.join(data_dir, "situations-sample.json")
            self._kb = KnowledgeBase(
                dtc_full if os.path.exists(dtc_full) else dtc_sample,
                sit_full if os.path.exists(sit_full) else sit_sample,
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
        features: Dict[str, Any] = extract_features(
            packet, tire_diameter=self._profile.tire_diameter,
        )

        # S23: inject VehicleProfile metadata для order/knock правил
        # (cylinder_count/fuel_type/bore_mm/knock_expected_freq_from_bore)
        features["cylinder_count"] = self._profile.cylinder_count
        features["fuel_type"] = self._profile.modifications.get("fuel_type")
        features["bore_mm"] = self._profile.bore_mm
        features["knock_expected_freq_from_bore"] = (
            self._profile.knock_expected_freq_from_bore
        )

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
        dual_regime_data: Optional[Dict[str, float]] = None,
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

        # Step 2b: Dual-regime fuel trim analysis (idle vs 2000 RPM)
        dual_regime_result = None
        if dual_regime_data is not None:
            ltft_idle = dual_regime_data.get("ltft_idle")
            ltft_2000rpm = dual_regime_data.get("ltft_2000rpm")
            if ltft_idle is not None and ltft_2000rpm is not None:
                dual_regime_result = self._fuel_trim_analyzer.analyze_dual_regime(
                    ltft_idle=ltft_idle,
                    ltft_2000rpm=ltft_2000rpm,
                    stft_idle=dual_regime_data.get("stft_idle", 0.0),
                    stft_2000rpm=dual_regime_data.get("stft_2000rpm", 0.0),
                )

        # Step 3 (GAP-C1): Read recent correlation results from DB and
        # generate Fact objects so they feed into the rule engine.
        if db_cursor is not None and client_hash is not None:
            correlation_facts = self._generate_correlation_facts(
                db_cursor, client_hash,
            )
            facts.extend(correlation_facts)
            # Update pipeline_result so DiagnosisBuilder sees correlation facts
            pipeline_result["facts"] = facts

        # Step 4: Rule engine evaluation
        rule_output = self._rule_engine.run_all(
            facts=facts,
            features=features,
            baselines=self.baselines,
            regime=packet.regime,
            packet=packet,
        )
        rule_results = rule_output["results"]
        shadow_results = rule_output.get("shadow_results", [])

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

        # Shadow rules — log for calibration, never show to user
        if shadow_results and db_cursor is not None and client_hash is not None:
            from .db_writers import write_shadow_log
            write_shadow_log(db_cursor, client_hash, shadow_results, features)

        # Step 4: Build diagnosis report (production rules only)
        report = self._diagnosis_builder.build_report(
            pipeline_result=pipeline_result,
            rule_results=rule_results,
            fuel_trim_result=fuel_trim_result,
            baseline_store=self.baselines,
        )

        # Step 4b: Attach dual-regime analysis to fuel_analysis block
        if dual_regime_result is not None:
            if report.get("fuel_analysis") is None:
                report["fuel_analysis"] = {}
            report["fuel_analysis"]["dual_regime"] = {
                "regime_pattern": dual_regime_result.regime_pattern,
                "idle_severity": dual_regime_result.idle_severity,
                "load_severity": dual_regime_result.load_severity,
                "diagnosis_hint": dual_regime_result.diagnosis_hint,
                "recommended_tests": dual_regime_result.recommended_tests,
                "ltft_idle": dual_regime_result.ltft_idle,
                "ltft_2000rpm": dual_regime_result.ltft_2000rpm,
                "stft_idle": dual_regime_result.stft_idle,
                "stft_2000rpm": dual_regime_result.stft_2000rpm,
            }

        # Step 5: Data quality gate — flag limited data, suppress low-confidence
        report = self._data_quality_check(packet, features, report)

        # Step 6: Optional DB persistence
        if db_cursor is not None and client_hash is not None:
            from .db_writers import save_baselines, write_fact_log, write_anomaly_scores
            from .db_readers import read_history

            regime_str = packet.regime.value
            save_baselines(db_cursor, client_hash, self.baselines)
            write_fact_log(db_cursor, client_hash, facts, packet.tier)

            # Read history for CUSUM columns in anomaly_scores (GAP-A2)
            history = read_history(db_cursor, client_hash, period="90d")
            write_anomaly_scores(
                db_cursor, client_hash, report, features, regime_str,
                history=history,
            )

        return report

    # ------------------------------------------------------------------
    # GAP-C1: Correlation → Facts
    # ------------------------------------------------------------------

    # Correlation type → diagnosis hint → detail mapping
    _CORRELATION_HINT_TO_FACT_DETAILS = {
        "engine_mount": {"system": "engine", "component": "engine_mount"},
        "wheel_bearing": {"system": "audio", "component": "wheel_bearing"},
        "cv_joint": {"system": "suspension", "component": "cv_joint"},
        "wheel_balance": {"system": "suspension", "component": "wheel_balance"},
        "accessory_bearing": {"system": "audio", "component": "accessory_bearing"},
    }

    # Minimum |r| threshold for a correlation to generate a fact
    _CORRELATION_R_THRESHOLD = 0.6

    def _generate_correlation_facts(
        self, db_cursor, client_hash: str,
    ) -> List[Fact]:
        """Read recent correlation_results from DB and produce Fact objects.

        For each significant correlation (|r| > threshold), generates a
        CORRELATION fact that feeds into rule_engine.run_all().
        """
        import time as _time
        from .db_readers import read_correlation_results
        from .facts import FactType

        try:
            correlations = read_correlation_results(
                db_cursor, client_hash, limit=50,
            )
        except Exception:
            return []  # Graceful degradation if table is missing

        facts: List[Fact] = []
        now = _time.time()

        for corr in correlations:
            r_value = corr.get("r_value", 0.0)
            if r_value is None:
                continue
            if abs(r_value) < self._CORRELATION_R_THRESHOLD:
                continue

            hint = corr.get("diagnosis_hint", "")
            detail_info = self._CORRELATION_HINT_TO_FACT_DETAILS.get(hint, {})

            facts.append(Fact(
                type=FactType.CORRELATION,
                timestamp=now,
                value=abs(r_value),
                severity="warning" if abs(r_value) >= 0.75 else "info",
                confidence=min(1.0, abs(r_value)),
                context={
                    "correlation_type": corr.get("correlation_type", ""),
                    "regime": corr.get("regime", "all"),
                },
                source_tier="T3",
                details={
                    "correlation_type": corr.get("correlation_type", ""),
                    "r_value": round(r_value, 4),
                    "slope": corr.get("slope", 0.0),
                    "p_value": corr.get("p_value", 1.0),
                    "data_points": corr.get("data_points", 0),
                    "diagnosis_hint": hint,
                    **detail_info,
                },
            ))

        return facts

    # ------------------------------------------------------------------
    # Data quality gate (F4)
    # ------------------------------------------------------------------

    def _data_quality_check(self, packet, features: dict, report: dict) -> dict:
        """Check data quality and flag limited reliability.

        If regime is UNKNOWN, or key feature variance is ~0,
        mark report as limited and suppress low-confidence diagnoses.
        """
        issues: List[str] = []

        # Check regime: if unknown, data might be garbage
        if packet.regime.value == "unknown":
            issues.append("regime_unknown")

        # Check feature variance: if all features near-zero, sensor might be dead
        key_features = ["az_std", "total_vibration"]
        frozen_count = 0
        for feat in key_features:
            val = features.get(feat, None)
            # az_std lives on the packet, not in features dict
            if val is None:
                val = getattr(packet, feat, None)
            if val is not None and abs(val) < 0.001:
                frozen_count += 1
        if frozen_count == len(key_features) and len(key_features) > 0:
            issues.append("features_frozen")

        if issues:
            report["data_quality"] = "limited"
            report["data_quality_issues"] = issues
            # Suppress low-confidence diagnoses
            if "diagnoses" in report:
                report["diagnoses"] = [
                    d for d in report["diagnoses"]
                    if d.get("confidence", 0) >= 50
                ]
        else:
            report["data_quality"] = "good"

        return report
