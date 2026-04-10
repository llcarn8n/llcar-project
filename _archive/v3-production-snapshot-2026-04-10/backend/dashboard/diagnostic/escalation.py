"""EscalationManager — tracks diagnostic persistence, cooldown, and severity escalation.

Manages per-client, per-rule state:
  - How many times a rule fired consecutively
  - When it first fired
  - Maximum confidence ever seen
  - Current escalation level (0=notice, 1=warning, 2=problem, 3=urgent)
  - User cooldown (7 days after dismissal)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple


COOLDOWN_DAYS = 7

# (min_days_active, min_consecutive, min_confidence)
ESCALATION_THRESHOLDS = [
    (0, 1, 0),     # level 0: notice — first trigger
    (3, 3, 40),    # level 1: warning — 3+ days, 3+ consecutive, confidence > 40
    (7, 5, 50),    # level 2: problem — 7+ days, 5+ consecutive, confidence > 50
    (14, 10, 70),  # level 3: urgent — 14+ days, 10+ consecutive, confidence > 70
]

LEVEL_NAMES = ["notice", "warning", "problem", "urgent"]


@dataclass
class PersistenceRecord:
    client_hash: str
    rule_name: str
    consecutive_count: int = 0
    first_triggered: Optional[str] = None   # ISO datetime
    last_triggered: Optional[str] = None    # ISO datetime
    max_confidence: int = 0
    escalation_level: int = 0               # 0-3
    user_dismissed_at: Optional[str] = None # ISO datetime


class EscalationManager:
    """Manages diagnostic rule persistence and escalation.

    In-memory store (dict). Can load/save from DB.
    """

    def __init__(self):
        self._store: Dict[Tuple[str, str], PersistenceRecord] = {}

    def load_from_db(self, cursor, client_hash: str) -> None:
        """Load all persistence records for a client from diagnostic_persistence."""
        # Detect placeholder
        module_name = type(cursor).__module__
        ph = '?' if 'sqlite' in module_name else '%s'

        cursor.execute(
            f"""SELECT rule_name, consecutive_count, first_triggered, last_triggered,
                       max_confidence, escalation_level, user_dismissed_at
                FROM diagnostic_persistence WHERE client_hash = {ph}""",
            (client_hash,)
        )
        columns = ['rule_name', 'consecutive_count', 'first_triggered', 'last_triggered',
                    'max_confidence', 'escalation_level', 'user_dismissed_at']
        for row in cursor.fetchall():
            if hasattr(row, 'keys'):
                d = dict(row)
            else:
                d = dict(zip(columns, row))
            rec = PersistenceRecord(
                client_hash=client_hash,
                rule_name=d['rule_name'],
                consecutive_count=d.get('consecutive_count', 0),
                first_triggered=d.get('first_triggered'),
                last_triggered=d.get('last_triggered'),
                max_confidence=d.get('max_confidence', 0),
                escalation_level=d.get('escalation_level', 0),
                user_dismissed_at=d.get('user_dismissed_at'),
            )
            self._store[(client_hash, rec.rule_name)] = rec

    def save_to_db(self, cursor, client_hash: str) -> None:
        """Save all records for a client to diagnostic_persistence."""
        module_name = type(cursor).__module__
        ph = '?' if 'sqlite' in module_name else '%s'

        for key, rec in self._store.items():
            if rec.client_hash != client_hash:
                continue
            if ph == '?':
                cursor.execute("""
                    INSERT OR REPLACE INTO diagnostic_persistence
                    (client_hash, rule_name, consecutive_count, first_triggered, last_triggered,
                     max_confidence, escalation_level, user_dismissed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (rec.client_hash, rec.rule_name, rec.consecutive_count,
                      rec.first_triggered, rec.last_triggered, rec.max_confidence,
                      rec.escalation_level, rec.user_dismissed_at))
            else:
                cursor.execute("""
                    INSERT INTO diagnostic_persistence
                    (client_hash, rule_name, consecutive_count, first_triggered, last_triggered,
                     max_confidence, escalation_level, user_dismissed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (client_hash, rule_name)
                    DO UPDATE SET consecutive_count=EXCLUDED.consecutive_count,
                                  first_triggered=EXCLUDED.first_triggered,
                                  last_triggered=EXCLUDED.last_triggered,
                                  max_confidence=EXCLUDED.max_confidence,
                                  escalation_level=EXCLUDED.escalation_level,
                                  user_dismissed_at=EXCLUDED.user_dismissed_at
                """, (rec.client_hash, rec.rule_name, rec.consecutive_count,
                      rec.first_triggered, rec.last_triggered, rec.max_confidence,
                      rec.escalation_level, rec.user_dismissed_at))

    def update(self, client_hash: str, rule_name: str, confidence: int,
               now: Optional[str] = None) -> PersistenceRecord:
        """Update persistence for a rule that fired.

        - If in cooldown -> return existing record without changes
        - Otherwise increment consecutive_count, update max_confidence,
          recalculate escalation_level
        """
        if now is None:
            now = datetime.now(timezone.utc).isoformat()

        key = (client_hash, rule_name)
        rec = self._store.get(key)

        if rec is None:
            rec = PersistenceRecord(
                client_hash=client_hash,
                rule_name=rule_name,
                consecutive_count=1,
                first_triggered=now,
                last_triggered=now,
                max_confidence=confidence,
                escalation_level=0,
            )
            self._store[key] = rec
            return rec

        # Check cooldown
        if self.is_in_cooldown(client_hash, rule_name, now):
            return rec

        # Update record
        rec.consecutive_count += 1
        rec.last_triggered = now
        if confidence > rec.max_confidence:
            rec.max_confidence = confidence

        # Recalculate escalation level
        rec.escalation_level = self._calc_level(rec, now)

        return rec

    def dismiss(self, client_hash: str, rule_name: str,
                now: Optional[str] = None) -> None:
        """User dismissed a diagnosis. Set cooldown, reset consecutive count."""
        if now is None:
            now = datetime.now(timezone.utc).isoformat()

        key = (client_hash, rule_name)
        rec = self._store.get(key)
        if rec is None:
            return

        rec.user_dismissed_at = now
        rec.consecutive_count = 0

    def is_in_cooldown(self, client_hash: str, rule_name: str,
                       now: Optional[str] = None) -> bool:
        """Check if rule is in 7-day cooldown period after user dismissal."""
        key = (client_hash, rule_name)
        rec = self._store.get(key)
        if rec is None or rec.user_dismissed_at is None:
            return False

        if now is None:
            now = datetime.now(timezone.utc).isoformat()

        dismissed = datetime.fromisoformat(rec.user_dismissed_at)
        current = datetime.fromisoformat(now)
        return (current - dismissed) < timedelta(days=COOLDOWN_DAYS)

    def get_record(self, client_hash: str, rule_name: str) -> Optional[PersistenceRecord]:
        """Get persistence record for a rule."""
        return self._store.get((client_hash, rule_name))

    def get_escalation_info(self, client_hash: str, rule_name: str) -> Optional[dict]:
        """Get escalation info dict for a diagnosis report.

        Returns: {first_seen, days_active, level, level_name,
                  consecutive_count, was_dismissed, max_confidence}
        """
        rec = self.get_record(client_hash, rule_name)
        if rec is None:
            return None

        days_active = 0
        if rec.first_triggered and rec.last_triggered:
            first = datetime.fromisoformat(rec.first_triggered)
            last = datetime.fromisoformat(rec.last_triggered)
            days_active = max(0, (last - first).days)

        return {
            "first_seen": rec.first_triggered,
            "days_active": days_active,
            "level": rec.escalation_level,
            "level_name": LEVEL_NAMES[min(rec.escalation_level, len(LEVEL_NAMES) - 1)],
            "consecutive_count": rec.consecutive_count,
            "was_dismissed": rec.user_dismissed_at is not None,
            "max_confidence": rec.max_confidence,
        }

    def _calc_level(self, rec: PersistenceRecord, now: str) -> int:
        """Calculate escalation level based on thresholds."""
        days_active = 0
        if rec.first_triggered:
            first = datetime.fromisoformat(rec.first_triggered)
            current = datetime.fromisoformat(now)
            days_active = max(0, (current - first).days)

        level = 0
        for lvl, (min_days, min_count, min_conf) in enumerate(ESCALATION_THRESHOLDS):
            if (days_active >= min_days and
                rec.consecutive_count >= min_count and
                rec.max_confidence >= min_conf):
                level = lvl

        return level
