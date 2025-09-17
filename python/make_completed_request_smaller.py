import sys
import importlib.util
import json
import argparse
import time
import logging
import os
import random
import math

# Step 1: Check for required libraries
required_libraries = ['tqdm', 'psutil']
missing_libraries = []

for lib in required_libraries:
    if importlib.util.find_spec(lib) is None:
        missing_libraries.append(lib)

if missing_libraries:
    print("Error: The following required libraries are missing:", ", ".join(missing_libraries), file=sys.stderr)
    print("\nTo install them, use a virtual environment (recommended to avoid system conflicts):", file=sys.stderr)
    print("1. Create a virtual environment:", file=sys.stderr)
    print("   python3 -m venv ~/smartrent_venv", file=sys.stderr)
    print("2. Activate the virtual environment:", file=sys.stderr)
    print("   source ~/smartrent_venv/bin/activate", file=sys.stderr)
    print("3. Install the missing libraries:", file=sys.stderr)
    print(f"   pip install {' '.join(missing_libraries)}", file=sys.stderr)
    print("4. Run the script again within the virtual environment:", file=sys.stderr)
    print(f"   python {sys.argv[0]} -f input.json -n 4000 -o output.json [-r | -s [percentage]]", file=sys.stderr)
    print("5. Deactivate when done:", file=sys.stderr)
    print("   deactivate", file=sys.stderr)
    print("\nAlternatively, if you prefer using pipx:", file=sys.stderr)
    print("1. Install pipx (if not already installed):", file=sys.stderr)
    print("   brew install pipx", file=sys.stderr)
    print("2. Run the script with pipx:", file=sys.stderr)
    print(f"   pipx run --spec tqdm --spec psutil python {sys.argv[0]} -f input.json -n 4000 -o output.json [-r | -s [percentage]]", file=sys.stderr)
    sys.exit(1)

# Import required libraries after verification
from tqdm import tqdm
import psutil

# Set up logging to console and file
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('telemetry.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger()

# Set up argument parser
parser = argparse.ArgumentParser(description="Process a JSON array with telemetry, optionally sorting by requestId or selecting a random percentage, skipping invalid entries.")
parser.add_argument("-f", "--file", required=True, help="Input JSON file path")
parser.add_argument("-n", "--number", type=int, required=True, help="Number of elements to process (ignored if --random is used)")
parser.add_argument("-o", "--output", required=True, help="Output JSON file path")
parser.add_argument("-r", "--requestId", action="store_true", help="Sort by requestId before processing")
parser.add_argument("-s", "--random", type=float, nargs="?", const=25.0, help="Select a random percentage of records (default 25%), overrides --number")

# Parse arguments
args = parser.parse_args()

# Validate arguments
if args.random is not None and (args.random <= 0 or args.random > 100):
    logger.error("Random percentage must be between 0 and 100")
    sys.exit(1)

if args.requestId and args.random is not None:
    logger.error("Cannot use both --requestId and --random flags")
    sys.exit(1)

# Function to get memory usage
def get_memory_usage():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    return mem_info.rss / 1024 / 1024  # Return memory in MB

# Initialize telemetry
start_time = time.time()
memory_start = get_memory_usage()
logger.info(f"Starting script with arguments: file={args.file}, number={args.number}, output={args.output}, requestId={args.requestId}, random={args.random}")
logger.info(f"Initial memory usage: {memory_start:.2f} MB")

# Step 2: Read and parse JSON array
step_start = time.time()
logger.info("Step 1: Loading JSON file")
try:
    with open(args.file, 'r') as file:
        data = json.load(file)
except FileNotFoundError:
    logger.error(f"Input file '{args.file}' not found")
    sys.exit(1)
except json.JSONDecodeError as e:
    logger.error(f"'{args.file}' is not a valid JSON file: {str(e)}")
    sys.exit(1)

if not isinstance(data, list):
    logger.error(f"Input JSON in '{args.file}' must be an array")
    sys.exit(1)

total_records = len(data)
logger.info(f"Loaded {total_records} records in {time.time() - step_start:.2f} seconds")
logger.info(f"Memory usage after loading: {get_memory_usage():.2f} MB")

# Step 3: Filter valid objects
step_start = time.time()
logger.info("Step 2: Filtering valid objects")
valid_data = []
skipped_count = 0
for i, item in tqdm(enumerate(data), total=total_records, desc="Filtering records"):
    try:
        if not isinstance(item, dict):
            raise KeyError("Item is not a dictionary")
        if not isinstance(item.get('completed_requests'), dict):
            raise KeyError("Missing or invalid 'completed_requests'")
        if not isinstance(item['completed_requests'].get('requestId'), str):
            raise KeyError("Missing or invalid 'requestId'")
        valid_data.append(item)
    except (KeyError, TypeError) as e:
        logger.warning(f"Skipping invalid object at index {i}: {str(e)}")
        skipped_count += 1

valid_count = len(valid_data)
logger.info(f"Filtered {valid_count} valid records, skipped {skipped_count} invalid records in {time.time() - step_start:.2f} seconds")
logger.info(f"Memory usage after filtering: {get_memory_usage():.2f} MB")

if not valid_data:
    logger.error("No valid objects found in the input JSON")
    sys.exit(1)

# Step 4: Sort or select random subset
step_start = time.time()
if args.random is not None:
    logger.info(f"Step 3: Selecting random {args.random}% of {valid_count} valid records")
    num_records = max(1, math.floor(valid_count * args.random / 100))
    valid_data = random.sample(valid_data, min(num_records, valid_count))
    logger.info(f"Selected {len(valid_data)} random records in {time.time() - step_start:.2f} seconds")
elif args.requestId:
    logger.info("Step 3: Sorting by requestId")
    valid_data.sort(key=lambda x: x['completed_requests']['requestId'])
    logger.info(f"Sorted {valid_count} records in {time.time() - step_start:.2f} seconds")
else:
    logger.info("Step 3: Skipping sorting or random selection")
logger.info(f"Memory usage after processing: {get_memory_usage():.2f} MB")

# Step 5: Take the first n records (if not random)
step_start = time.time()
if args.random is None:
    logger.info(f"Step 4: Selecting first {args.number} records")
    subset = valid_data[:args.number]
else:
    logger.info("Step 4: Skipping selection (using random subset)")
    subset = valid_data
output_count = len(subset)
logger.info(f"Selected {output_count} records in {time.time() - step_start:.2f} seconds")
logger.info(f"Memory usage after selection: {get_memory_usage():.2f} MB")

# Step 6: Write to output file
step_start = time.time()
logger.info("Step 5: Writing to output file")
try:
    with open(args.output, 'w') as file:
        json.dump(subset, file, indent=2)
    logger.info(f"Wrote {output_count} records to '{args.output}' in {time.time() - step_start:.2f} seconds")
except Exception as e:
    logger.error(f"Failed to write to '{args.output}': {str(e)}")
    sys.exit(1)

# Final telemetry
total_time = time.time() - start_time
memory_end = get_memory_usage()
logger.info(f"Script completed in {total_time:.2f} seconds")
logger.info(f"Final memory usage: {memory_end:.2f} MB")
logger.info(f"Peak memory usage: {max(get_memory_usage(), memory_start):.2f} MB")
logger.info(f"Summary: Total records={total_records}, Valid records={valid_count}, Skipped records={skipped_count}, Output records={output_count}")