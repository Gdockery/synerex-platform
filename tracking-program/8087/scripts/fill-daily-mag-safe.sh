#!/bin/bash

# Safe script to fill daily meterdataaggregate rollups
# Processes one project at a time to avoid lock timeouts

DB_USER="xeco_staging"
DB_PASS="xecopass"
DB_NAME="xeco"

echo "Starting daily rollup fill for meterdataaggregate..."

# First, delete all daily rollups (empty intervalId) - this should be quick
echo "Deleting existing daily rollups..."
mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -N -e "DELETE FROM meterdataaggregate WHERE intervalId = '';" 2>&1 | grep -v "Warning"

# Get list of projects that have meterdataaggregate data
echo "Finding projects with aggregate data..."
PROJECTS=$(mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -N -e "SELECT DISTINCT project FROM meterdataaggregate WHERE intervalId != '' ORDER BY project;" 2>&1 | grep -v "Warning")

if [ -z "$PROJECTS" ]; then
  echo "No projects found with aggregate data."
  exit 0
fi

echo "Found projects: $PROJECTS"
echo "Processing one project at a time..."

# Process each project separately
for PROJECT_ID in $PROJECTS; do
  echo "Processing project $PROJECT_ID..."
  
  # Get distinct days for this project
  DAYS=$(mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -N -e "SELECT DISTINCT day FROM meterdataaggregate WHERE project = $PROJECT_ID AND intervalId != '' ORDER BY day;" 2>&1 | grep -v "Warning")
  
  if [ -z "$DAYS" ]; then
    echo "  No days found for project $PROJECT_ID, skipping..."
    continue
  fi
  
  # Process each day separately to avoid locks
  for DAY in $DAYS; do
    echo "  Processing day $DAY for project $PROJECT_ID..."
    
    # Insert daily rollup for this specific day and project
    # Note: This matches the DAILY_SQL from perform-rollup.js but adds peakKw/peakKva
    mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -N <<EOF 2>&1 | grep -v "Warning"
INSERT INTO meterdataaggregate (
  createdAt, updatedAt, day, numSamples, peakKw, peakKva, avgVolt, avgAmp, avgKw, avgKva, avgPf, avgKvar, project, intervalId
) 
SELECT 
  MAX(createdAt) as createdAt,
  UNIX_TIMESTAMP() * 1000 as updatedAt,
  '$DAY' as day,
  SUM(numSamples) as numSamples,
  MAX(avgKw) as peakKw,
  MAX(avgKva) as peakKva,
  AVG(avgVolt) as avgVolt,
  AVG(avgAmp) as avgAmp,
  AVG(avgKw) as avgKw,
  AVG(avgKva) as avgKva,
  AVG(avgPf) as avgPf,
  AVG(avgKvar) as avgKvar,
  $PROJECT_ID as project,
  '' as intervalId
FROM meterdataaggregate
WHERE project = $PROJECT_ID 
  AND day = '$DAY' 
  AND intervalId != ''
GROUP BY day, project;
EOF
    
    if [ $? -eq 0 ]; then
      echo "    ✓ Successfully created daily rollup for $DAY"
    else
      echo "    ✗ Error creating daily rollup for $DAY"
    fi
  done
  
  echo "  Completed project $PROJECT_ID"
done

echo "Done! Daily rollups created for all projects."

