import pdfplumber
import pymongo
import re

PDF_PATH = r"C:\Users\Jonne\Downloads\paris-nice.pdf"
MONGO_URI = "mongodb+srv://jonnerdal:cycling_fantasy@cyclingfantasy.f5zyflt.mongodb.net/fantasy?retryWrites=true&w=majority"

client = pymongo.MongoClient(MONGO_URI)
db = client["fantasy"]
riders_collection = db["riders"]

# Bib ranges mapped to team codes
team_bib_ranges = {
    "TVL": range(1, 8),
    "RBH": range(10, 18),
    "IGD": range(20, 28),
    "UAD": range(30, 38),
    "LTK": range(40, 48),
    "TBV": range(50, 58),
    "GFC": range(60, 68),
    "MOV": range(70, 78),
    "SOQ": range(80, 88),
    "NSN": range(90, 98),
    "DCT": range(100, 108),
    "JAY": range(110, 118),
    "XAT": range(120, 128),
    "COF": range(130, 138),
    "TUD": range(140, 148),
    "TPP": range(150, 158),
    "EFE": range(160, 168),
    "UXM": range(170, 178),
    "PQT": range(180, 188),
    "TEN": range(190, 198),
    "APT": range(200, 208),
    "LOI": range(210, 218)
}

team_names = {
    "TVL":"Team Visma | Lease a Bike",
    "RBH":"Red Bull - BORA - hansgrohe",
    "IGD":"INEOS Grenadiers",
    "UAD":"UAE Team Emirates - XRG",
    "LTK":"Lidl - Trek",
    "TBV":"Bahrain - Victorious",
    "GFC":"Groupama - FDJ United",
    "MOV":"Movistar Team",
    "SOQ":"Soudal Quick-Step",
    "NSN":"NSN Cycling Team",
    "DCT":"Decathlon CMA CGM Team",
    "JAY":"Team Jayco AlUla",
    "XAT":"XDS Astana Team",
    "COF":"Cofidis",
    "TUD":"Tudor Pro Cycling Team",
    "TPP":"Team Picnic PostNL",
    "EFE":"EF Education - EasyPost",
    "UXM":"Uno-X Mobility",
    "PQT":"Pinarello Q36.5 Pro Cycling Team",
    "TEN":"TotalEnergies",
    "APT":"Alpecin-Premier Tech",
    "LOI":"Lotto Intermarché"
}

def rider_type(age):
    return "youth" if age <= 25 else "captain"

def get_team_code(bib):
    for code, bib_range in team_bib_ranges.items():
        if bib in bib_range:
            return code
    return None

source_riders = {}
failed_riders = []

# Extract text from PDF
with pdfplumber.open(PDF_PATH) as pdf:
    text = ""
    for page in pdf.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

# Regex to capture riders: bib, name, age, time
pattern = r"(\d+)\.\s+(.+?)\s+(\d+)\s+(\d+:\d+)"
matches = re.findall(pattern, text)
print(f"Found {len(matches)} riders in PDF.")

# Build rider documents
for bib, name, age, time in matches:
    try:
        bib = int(bib)
        age = int(age)

        team_code = get_team_code(bib)
        if not team_code:
            raise ValueError(f"No team code found for bib {bib}")

        doc = {
            "bib": bib,
            "name": name.title(),
            "age": age,
            "overall_time": time,
            "rider_type": rider_type(age),
            "team_code": team_code,
            "team_name": team_names[team_code],
            "team_jersey": f"/jerseys/{team_code}.png"
        }

        key = (doc["name"], team_code)
        source_riders[key] = doc

    except Exception as e:
        failed_riders.append({"bib": bib, "name": name, "error": str(e)})

print("Parsed riders successfully:", len(source_riders))
if failed_riders:
    print("Riders that failed parsing or were skipped:")
    for fr in failed_riders:
        print(fr)

# UPSERT into MongoDB, checking for duplicates
for key, doc in source_riders.items():
    try:
        # Check if rider already exists
        existing = riders_collection.find_one({"name": doc["name"], "team_code": doc["team_code"]})
        if existing:
            # Already exists → skip or optionally update
            riders_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": doc}
            )
            print(f"Updated existing rider: {doc['name']} ({doc['team_code']})")
        else:
            # Insert new rider
            riders_collection.insert_one(doc)
            print(f"Inserted new rider: {doc['name']} ({doc['team_code']})")
    except Exception as e:
        print(f"Failed to insert/update {doc['name']}: {e}")

# DELETE riders in DB that are no longer in the PDF
for rider in riders_collection.find():
    key = (rider["name"], rider["team_code"])
    if key not in source_riders:
        riders_collection.delete_one({"_id": rider["_id"]})
        print(f"Deleted {rider['name']} from DB (no longer in source).")

print("Final DB count:", riders_collection.count_documents({}))
print("Sync complete.")