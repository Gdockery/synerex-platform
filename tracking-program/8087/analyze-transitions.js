/**
 * Script to analyze CSV transitions
 * Compares totalkva 5 minutes before and after transition times
 */

const fs = require('fs');
const path = require('path');
const Moment = require('moment-timezone');

// Transition times on 2026-01-17
const transitions = [
  { time: '08:00', label: '8am' },
  { time: '11:00', label: '11am' },
  { time: '14:00', label: '2pm' },
  { time: '17:00', label: '5pm' },
  { time: '20:00', label: '8pm' },
  { time: '23:00', label: '11pm' }
];

function parseTime(timeStr) {
  // Parse "Start Time" column - format might be like "2026-01-17 08:00:00" or similar
  return Moment(timeStr);
}

function findRowAtTime(data, targetTime) {
  // Find the row closest to the target time
  const target = Moment(`2026-01-17 ${targetTime}`, 'YYYY-MM-DD HH:mm');
  
  // Find exact match or closest
  for (let row of data) {
    const rowTime = parseTime(row['Start Time'] || row['StartTime'] || row.startTime);
    if (rowTime.format('YYYY-MM-DD HH:mm') === target.format('YYYY-MM-DD HH:mm')) {
      return row;
    }
  }
  
  // If no exact match, find closest
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
  // Try different possible column names
  return parseFloat(row['totalKva'] || row['TotalKva'] || row['total KVA'] || row['Total KVA'] || row.totalKva || 0);
}

function parseCSVLine(line) {
  const result = {};
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

function analyzeTransitions(csvFilePath) {
  return new Promise((resolve, reject) => {
    try {
      const csvContent = fs.readFileSync(csvFilePath, 'utf8');
      const { headers, rows: results } = parseCSV(csvContent);
        console.log(`\nLoaded ${results.length} rows from CSV\n`);
        
        if (results.length === 0) {
          return reject(new Error('CSV file is empty'));
        }
        
        // Show column names
        console.log('Available columns:', Object.keys(results[0]).join(', '));
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
        
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Main execution
if (require.main === module) {
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('Usage: node analyze-transitions.js <path-to-csv-file>');
    console.error('\nExample:');
    console.error('  node analyze-transitions.js /path/to/Cloud\\ Kitchen\\ Dallas\\ -\\ 1\\ -\\ 2026-01-17\\ to\\ 2026-01-17\\ \\(1\\ minute\\ intervals\\).csv');
    process.exit(1);
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }
  
  analyzeTransitions(csvFilePath)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { analyzeTransitions };
