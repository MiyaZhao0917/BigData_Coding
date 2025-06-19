import json
import random

# Define a list of existing animal IDs to simulate encounters between them
animal_ids = ["cat001", "dog001", "cat002", "dog002", "cat003"]

# Initialize an empty list to store generated encounter records
encounters = []
# Generate 5 random encounter records between pairs of animals
for _ in range(5):
    # Randomly select two different animals for the encounter
    a1, a2 = random.sample(animal_ids, 2)
    # Randomly determine the number of times they have encountered each other (1 to 5)
    count = random.randint(1, 5)
    # Append the encounter record as a dictionary to the list
    encounters.append({
        "animal1": a1,  # ID of the first animal
        "animal2": a2,  # ID of the second animal
        "count": count  # Number of interactions between them
    })

# Write the generated encounters list to a JSON file with indentation for readability
with open("encounter.json", "w") as f:
    json.dump(encounters, f, indent=2)

print("✅ encounter.json has been generated.")
