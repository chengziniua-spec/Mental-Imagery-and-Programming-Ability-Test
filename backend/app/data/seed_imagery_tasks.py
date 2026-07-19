# Objective imagery task stimuli. Design rationale and literature basis are
# documented in IMAGERY_TASK_DESIGN.md at the repo root (not duplicated here).

MENTAL_ROTATION_ITEMS = [
    {"id": "mr_01", "letter": "F", "angle": 0, "mirrored": False},
    {"id": "mr_02", "letter": "F", "angle": 90, "mirrored": True},
    {"id": "mr_03", "letter": "G", "angle": 135, "mirrored": False},
    {"id": "mr_04", "letter": "R", "angle": 180, "mirrored": True},
    {"id": "mr_05", "letter": "L", "angle": 45, "mirrored": False},
    {"id": "mr_06", "letter": "J", "angle": 270, "mirrored": True},
    {"id": "mr_07", "letter": "P", "angle": 225, "mirrored": False},
    {"id": "mr_08", "letter": "Q", "angle": 315, "mirrored": True},
    {"id": "mr_09", "letter": "R", "angle": 0, "mirrored": True},
    {"id": "mr_10", "letter": "G", "angle": 180, "mirrored": False},
]

# 12-icon pool; each participant gets a random 6/6 old/new split (see
# assign_conditions-style logic in participants.py) so no single icon is a
# systematic confound across the sample.
PICTURE_POOL = [
    "Umbrella", "Bike", "Fish", "Guitar", "Camera", "Anchor",
    "Rocket", "Cherry", "Snowflake", "Feather", "Compass", "Backpack",
]
