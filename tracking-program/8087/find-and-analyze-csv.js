/**
 * Script to find CSV file and analyze transitions
 * This script will:
 * 1. Query the database for the CSV record
 * 2. Find the CSV file location
 * 3. Analyze transitions at specified times
 */

// This needs to be run in the sails context
// Usage: Run this from within sails console or as a sails helper

const fs = require('fs');
const Moment = require('moment-timezone');

const transitions = [
  { time: '08:00', label: '8am' },
  { time: '11:00', label: '11am' },
  { time: '14:00', label: '2pm' },
  { time: '17:00', label: '5pm' },
  { time: '20:00', label: '8pm' },
  { time: '23:00', label: '11pm' }
];

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

function parseTime(timeStr) {
  return Moment(timeStr);
}

function findRowAtTime(data, targetTime) {
  const target = Moment(`2026-01-17 ${targetTime}`, 'YYYY-MM-DD HH:mm');
  
  for (let row of data) {
    const rowTime = parseTime(row['Start Time'] || row['StartTime'] || row.startTime);
    if (rowTime.format('YYYY-MM-DD HH:mm') === target.format('YYYY-MM-DD HH:mm')) {
      return row;
    }
  }
  
  let closest = null;
  let minDiff = Infinity;
  for (let row of data) {
    const rowTime = parseTime(row['Start Time'] || row['StartTime'] || row.startTime);
    const diff = Math.abs(rowTime.diff(target));
    if (diff < minDiff) {
      minDiff = diff;
      closest = row;
    }
  }
  return closest;
}

function getTotalKva(row) {
  return parseFloat(row['totalKva'] || row['TotalKva'] || row['total KVA'] || row['Total KVA'] || row.totalKva || 0);
}

async function analyzeCSVTransitions() {
  const MeterCSV = sails.models.metercsv;
  const StorageService = require('./api/services/StorageService');
  
  try {
    // Find the CSV record
    const csvRecord = await MeterCSV.findOne({
      title: 'Cloud Kitchen Dallas - 1 - 2026-01-17 to 2026-01-17 (1 minute intervals).csv'
    });
    
    if (!csvRecord) {
      console.log('CSV record not found in database');
      return;
    }
    
    console.log('Found CSV record:', csvRecord.id);
    
    // Get the CSV file path
    const csvPath = 'csv/' + csvRecord.title;
    const localPath = StorageService.localPath(csvPath);
    
    console.log('Looking for CSV at:', localPath);
    
    if (!fs.existsSync(localPath)) {
      console.log('CSV file not found at local path. File might be in S3.');
      console.log('Please download the CSV file and provide the path, or check S3 storage.');
      return;
    }
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(localPath, 'utf8');
    const { headers, rows: results } = parseCSV(csvContent);
    
    console.log(`\nLoaded ${results.length} rows from CSV`);
    console.log('Available columns:', headers.join(', '));
    console.log('\n' + '='.repeat(80));
    console.log('TRANSITION ANALYSIS');
    console.log('='.repeat(80) + '\n');
    
    const analysis = [];
    
    for (let transition of transitions) {
      const transitionTime = Moment(`2026-01-17 ${transition.time}`, 'YYYY-MM-DD HH:mm');
      const beforeTime = transitionTime.clone().subtract(5, 'minutes');
      const afterTime = transitionTime.clone().add(5, 'minutes');
      
      const beforeRow = findRowAtTime(results, beforeTime.format('HH:mm'));
      const afterRow = findRowAtTime(results, afterTime.format('HH:mm'));
      
      const beforeKva = getTotalKva(beforeRow);
      const afterKva = getTotalKva(afterRow);
      const diff = afterKva - beforeKva;
      const percentChange = beforeKva > 0 ? ((diff / beforeKva) * 100).toFixed(2) : 'N/A';
      
      analysis.push({
        transition: transition.label,
        time: transition.time,
        beforeTime: beforeTime.format('HH:mm'),
        afterTime: afterTime.format('HH:mm'),
        beforeKva: beforeKva,
        afterKva: afterKva,
        diff: diff,
        percentChange: percentChange
      });
      
      console.log(`${transition.label} (${transition.time})`);
      console.log(`  5 min before (${beforeTime.format('HH:mm')}): ${beforeKva.toFixed(2)} kVA`);
      console.log(`  5 min after  (${afterTime.format('HH:mm')}): ${afterKva.toFixed(2)} kVA`);
      console.log(`  Difference: ${diff.toFixed(2)} kVA (${percentChange}%)`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('\nTransition | Before (kVA) | After (kVA) | Difference (kVA) | % Change');
    console.log('-'.repeat(80));
    analysis.forEach(a => {
      console.log(`${a.transition.padEnd(10)} | ${a.beforeKva.toFixed(2).padStart(13)} | ${a.afterKva.toFixed(2).padStart(12)} | ${a.diff.toFixed(2).padStart(15)} | ${a.percentChange.padStart(8)}`);
    });
    
    return analysis;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Export for use in sails console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeCSVTransitions };
}

// If running directly (not in sails context), provide instructions
if (require.main === module) {
  console.log('This script needs to be run in the Sails context.');
  console.log('To use it:');
  console.log('  1. Run: sails console');
  console.log('  2. Then: .load find-and-analyze-csv.js');
  console.log('  3. Then: analyzeCSVTransitions()');
}
