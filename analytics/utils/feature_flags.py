import os
import MySQLdb
import json
import hashlib
import time
import logging
import threading
from typing import Any, Dict, Optional, List

logger = logging.getLogger(__name__)

class FeatureFlagEvaluator:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(FeatureFlagEvaluator, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.definitions = {}
        self.last_refresh = 0
        self.ttl = int(os.getenv("FEATURE_FLAGS_TTL", 30))
        self.db_config = {
            "host": os.getenv("DB_HOST", "localhost"),
            "user": os.getenv("DB_USER", "gms_user"),
            "password": os.getenv("DB_PASSWORD", "GMS2026User"),
            "db": "feature_flags",
            "port": int(os.getenv("DB_PORT", 3306))
        }
        self._initialized = True

    def _get_db(self):
        try:
            return MySQLdb.connect(**self.db_config)
        except Exception as e:
            logger.error(f"Error connecting to feature_flags database: {e}")
            return None

    def refresh_definitions(self):
        db = self._get_db()
        if not db:
            return

        try:
            cursor = db.cursor()
            cursor.execute("SELECT id, name, type, scope_level, default_enabled, default_config, course_id FROM feature_flag_definitions")
            results = cursor.fetchall()
            
            new_definitions = {}
            for row in results:
                fid, name, flag_type, scope_level, enabled, config_json, course_id = row
                config = json.loads(config_json) if config_json else {}
                new_definitions[name] = {
                    "id": fid,
                    "type": flag_type,
                    "scope_level": scope_level,
                    "enabled": bool(enabled),
                    "config": config,
                    "course_id": course_id
                }
            
            self.definitions = new_definitions
            self.last_refresh = time.time()
        except Exception as e:
            logger.error(f"Error refreshing feature flag definitions: {e}")
        finally:
            db.close()

    def get_override(self, flag_id: int, scope_id: str) -> Optional[Dict[str, Any]]:
        db = self._get_db()
        if not db:
            return None

        try:
            cursor = db.cursor()
            cursor.execute(
                "SELECT enabled, config FROM feature_flag_overrides WHERE flag_id = %s AND scope_id = %s",
                (flag_id, scope_id)
            )
            result = cursor.fetchone()
            if result:
                enabled, config_json = result
                return {
                    "enabled": bool(enabled),
                    "config": json.loads(config_json) if config_json else {}
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching override for flag {flag_id}, scope {scope_id}: {e}")
            return None
        finally:
            db.close()

    def evaluate(self, name: str, context: Dict[str, Any] = None) -> bool:
        if time.time() - self.last_refresh > self.ttl:
            self.refresh_definitions()
        
        definition = self.definitions.get(name)
        if not definition:
            return False
        
        context = context or {}
        scope_id = context.get("course_id")
        
        # Check if flag is course-specific and matches
        if definition.get("course_id") and str(definition["course_id"]) != str(scope_id):
            return False
        
        effective_status = {
            "enabled": definition["enabled"],
            "config": definition["config"]
        }

        if definition["scope_level"] == "course" and scope_id:
            override = self.get_override(definition["id"], str(scope_id))
            if override:
                effective_status = override

        if not effective_status["enabled"]:
            return False
        
        flag_type = definition["type"]
        config = effective_status["config"]
        
        if flag_type == "boolean":
            return True
        
        elif flag_type == "percentage":
            user_id = context.get("user_id")
            if not user_id:
                return False
            
            percentage = config.get("percentage", 0)
            hash_val = int(hashlib.md5(f"{user_id}:{name}".encode()).hexdigest(), 16) % 100
            return hash_val < percentage
        
        elif flag_type == "user_based":
            user_id = context.get("user_id")
            role = context.get("role")
            
            allowed_users = config.get("allowed_users", [])
            allowed_roles = config.get("allowed_roles", [])
            
            if user_id in allowed_users:
                return True
            if role in allowed_roles:
                return True
            return False
        
        elif flag_type == "time_based":
            now = time.time()
            start_time = config.get("start_time")
            end_time = config.get("end_time")
            
            if start_time and now < start_time:
                return False
            if end_time and now > end_time:
                return False
            return True
        
        return False

evaluator = FeatureFlagEvaluator()

def is_feature_enabled(name: str, context: Dict[str, Any] = None) -> bool:
    return evaluator.evaluate(name, context)

def get_all_flags(context: Dict[str, Any] = None) -> Dict[str, bool]:
    if time.time() - evaluator.last_refresh > evaluator.ttl:
        evaluator.refresh_definitions()
    
    results = {}
    for name in evaluator.definitions:
        results[name] = evaluator.evaluate(name, context)
    return results
