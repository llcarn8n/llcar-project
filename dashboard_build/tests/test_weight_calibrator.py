import pytest
from diagnostic.weight_calibrator import WeightCalibrator, RuleAccuracy


class TestWeightCalibrator:
    def test_high_accuracy_rule(self):
        wc = WeightCalibrator(min_samples=5)
        feedback = [{"rule_name": "good_rule", "action": "confirmed"}] * 8 + \
                   [{"rule_name": "good_rule", "action": "dismissed"}] * 2
        results = wc.analyze(feedback)
        assert results[0].accuracy == 0.8
        assert results[0].recommendation == "keep"

    def test_low_accuracy_rule(self):
        wc = WeightCalibrator(min_samples=5)
        feedback = [{"rule_name": "bad_rule", "action": "confirmed"}] * 3 + \
                   [{"rule_name": "bad_rule", "action": "dismissed"}] * 7
        results = wc.analyze(feedback)
        assert results[0].accuracy == 0.3
        assert results[0].recommendation == "increase_threshold"

    def test_insufficient_data(self):
        wc = WeightCalibrator(min_samples=10)
        feedback = [{"rule_name": "new_rule", "action": "confirmed"}] * 3
        results = wc.analyze(feedback)
        assert results[0].recommendation == "insufficient_data"

    def test_resolved_counts_as_confirmed(self):
        wc = WeightCalibrator(min_samples=5)
        feedback = [{"rule_name": "r", "action": "resolved"}] * 5 + \
                   [{"rule_name": "r", "action": "dismissed"}] * 5
        results = wc.analyze(feedback)
        assert results[0].accuracy == 0.5
        assert results[0].resolved == 5

    def test_empty_feedback(self):
        wc = WeightCalibrator()
        assert wc.analyze([]) == []

    def test_multiple_rules_sorted(self):
        wc = WeightCalibrator(min_samples=3)
        feedback = [
            {"rule_name": "good", "action": "confirmed"},
            {"rule_name": "good", "action": "confirmed"},
            {"rule_name": "good", "action": "confirmed"},
            {"rule_name": "bad", "action": "dismissed"},
            {"rule_name": "bad", "action": "dismissed"},
            {"rule_name": "bad", "action": "dismissed"},
        ]
        results = wc.analyze(feedback)
        assert results[0].rule_name == "bad"  # worst first
        assert results[1].rule_name == "good"

    def test_generate_report(self):
        wc = WeightCalibrator(min_samples=3)
        feedback = [{"rule_name": "r1", "action": "confirmed"}] * 8 + \
                   [{"rule_name": "r1", "action": "dismissed"}] * 2
        results = wc.analyze(feedback)
        report = wc.generate_report(results)
        assert "r1" in report
        assert "Good Rules" in report
