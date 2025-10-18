#!/usr/bin/env python3
"""
Normalize all requestTime values in test_system_completed_requests.json
to be within a single 24-hour period (2025-08-15).

This ensures the Timeline charts display data within a consistent timeframe.
"""

import json
import re
from datetime import datetime, timedelta

# Read the JSON file
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, '..', 'sample', 'test_system_completed_requests.json')
with open(input_file, 'r') as f:
    data = json.load(f)

# Base date: 2025-08-15
base_date = datetime(2025, 8, 15)

# Generate times spread across 24 hours
total_samples = len(data)
print(f"Total samples: {total_samples}")

# Spread times across 24 hours with some clustering for realistic patterns
time_increment_minutes = (24 * 60) / total_samples  # Base increment

for i, entry in enumerate(data):
    if 'completed_requests' in entry and 'requestTime' in entry['completed_requests']:
        # Calculate time offset with some variation
        minutes_offset = int(i * time_increment_minutes)
        
        # Add some randomness but keep order (±5 minutes jitter)
        import random
        random.seed(i)  # Consistent randomness
        jitter = random.randint(-5, 5)
        minutes_offset = max(0, min(1439, minutes_offset + jitter))  # Keep within 24 hours
        
        new_time = base_date + timedelta(minutes=minutes_offset)
        new_time_str = new_time.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        
        old_time = entry['completed_requests']['requestTime']
        entry['completed_requests']['requestTime'] = new_time_str
        
        print(f"Sample {i+1:3d}: {old_time} → {new_time_str}")

# Write back to file
with open(input_file, 'w') as f:
    json.dump(data, f, indent=2)

print(f"\n✓ Updated {total_samples} requestTime values to 2025-08-15")
print(f"✓ All times now within 24-hour period")
