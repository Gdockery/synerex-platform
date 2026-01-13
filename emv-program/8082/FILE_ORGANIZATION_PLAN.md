# 📁 Synerex File Organization Plan

## Current Problem
Files are scattered across multiple directories with inconsistent naming and organization, making it difficult to find and manage files at different processing stages.

## Proposed Clean Structure

```
8082/
├── files/
│   ├── raw/                    # Original uploaded files (no processing)
│   │   ├── 2025-01-15/
│   │   │   ├── facility_a_baseline.csv
│   │   │   └── facility_a_post_retrofit.csv
│   │   └── 2025-01-16/
│   │       └── facility_b_baseline.csv
│   │
│   ├── processed/              # Files with fingerprints and ranges set
│   │   ├── ready_for_analysis/
│   │   │   ├── facility_a_baseline_processed.csv
│   │   │   └── facility_a_post_retrofit_processed.csv
│   │   └── archived/
│   │       └── old_processed_files/
│   │
│   ├── projects/               # Files assigned to specific projects
│   │   ├── lineage_windsor_sg2/
│   │   │   ├── before_file.csv
│   │   │   └── after_file.csv
│   │   └── lineage_windsor_sg3/
│   │       ├── before_file.csv
│   │       └── after_file.csv
│   │
│   └── temp/                   # Temporary files during processing
│       └── uploads/
│
├── reports/                    # Generated reports
│   ├── html/
│   ├── pdf/
│   └── exports/
│
└── backups/                    # Database and file backups
    ├── daily/
    └── weekly/
```

## Benefits

1. **Clear Separation**: Raw files vs processed files vs project files
2. **Date Organization**: Files organized by upload date
3. **Status Tracking**: Easy to see which files are ready for analysis
4. **Project Isolation**: Each project has its own folder
5. **Clean Naming**: Consistent, descriptive file names
6. **Easy Cleanup**: Clear distinction between temporary and permanent files

## Migration Plan

1. Create new folder structure
2. Move existing files to appropriate locations
3. Update database paths
4. Update file selection UI
5. Test file access and processing





















