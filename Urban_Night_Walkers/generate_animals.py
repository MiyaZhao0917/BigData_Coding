import random
import json
from datetime import datetime, timedelta

# Generates a list of timestamp strings at regular intervals
def generate_time_series(start_str="2025-06-15T21:00:00", end_str="2025-06-16T04:00:00", interval_minutes=10):
    start = datetime.fromisoformat(start_str)
    end = datetime.fromisoformat(end_str)
    times = []
    current = start
    while current <= end:
        # Format each datetime as string (ISO-like format)
        times.append(current.strftime("%Y-%m-%dT%H:%M:%S"))
        current += timedelta(minutes=interval_minutes)
    return times

# Generates a simulated animal record with movement track and optional rest periods
def generate_animal(id_prefix, species, gender, age, start_lat, start_lng, times):
    lat, lng = start_lat, start_lng
    track = []
    
    # Randomly determine the start index and length of a rest period (when animal stays still)
    rest_start_idx = random.randint(5, len(times)-10)
    rest_len = random.randint(3, 8)

    for i, t in enumerate(times):
        if rest_start_idx <= i < rest_start_idx + rest_len:
            # During rest period: no movement, coordinates unchanged
            pass
        else:
            # Small random movement around previous position
            lat += random.uniform(-0.0008, 0.0008)
            lng += random.uniform(-0.0008, 0.0008)
        # Record position and time
        track.append({
            "time": t,
            "lat": round(lat, 6),     # Round to 6 decimal places for precision
            "lng": round(lng, 6)
        })
    
    return {
        "id": id_prefix,
        "species": species,
        "gender": gender,
        "age": age,
        "track": track
    }

# Generate a list of timestamps representing the full tracking period
times = generate_time_series()

# Generate simulated animal data for multiple animals with different starting points
animals = [
    generate_animal("cat001", "cat", "female", 2, 51.5074, -0.1278, times),
    generate_animal("dog001", "dog", "male", 4, 51.5060, -0.1300, times),
    generate_animal("cat002", "cat", "male", 3, 51.5080, -0.1250, times),
    generate_animal("dog002", "dog", "female", 5, 51.5050, -0.1280, times),
    generate_animal("cat003", "cat", "female", 1, 51.5090, -0.1260, times)
]

# Export the generated data to a JSON file with readable indentation
with open("animals.json", "w") as f:
    json.dump(animals, f, indent=2)

print("✅ animals.json has been generated.")
