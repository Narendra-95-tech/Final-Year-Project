# Implementation Plan: Project Organization & Documentation Preservation

This plan outlines the steps to reorganize the project structure for better clarity and to preserve important documentation and development tools.

## Proposed Changes

### Documentation Preservation
- **[NEW]** `docs/`: Create a new directory for project documentation.
- **[COPY]** `docs/implementation_plan.md`: Copy from current session artifacts.
- **[COPY]** `docs/task.md`: Copy from current session artifacts.
- **[COPY]** `docs/walkthrough.md`: Copy from current session artifacts.

### Developer Tools Organization
- **[NEW]** `scripts/tools/`: Create a directory for development and debugging scripts currently cluttering the root.
- **[MOVE]** Move the following files from root to `scripts/tools/`:
  - `check_atlas_listings.js`
  - `check_db_config.js`
  - `check_listings_db.js`
  - `debug_env.js`
  - `debug_review.js`
  - `test-auth-otp.js`
  - `test-db.js`
  - `test-email.js`
  - `test-forgot-password.js`
  - `test-otp.js`
  - `test-pdf-gen.js`
  - `test_review_backend.js`
  - `verify_backend_minimal.js`
- **[MOVE]** Move output/log files to `scripts/tools/logs/`:
  - `check_output.txt`
  - `debug_env_output.txt`
  - `error_log.txt`
  - `test_output.txt`
  - `test-invoice.pdf` (Move to a temp/ or delete if not needed)

### Configuration Templates
- **[NEW]** `.env.example`: Create a template based on `.env` with sanitized values.

### Project Metadata
- **[MODIFY]** `.gitignore`: Organize by category and ensure it covers the new `scripts/tools/logs/` directory.
- **[MODIFY]** `README.md`: Add a "Project Structure" section or update existing one to reflect the new layout and point to `docs/`.

## Verification Plan

### Automated Checks
1.  **Dependency Resolution**: Run a sample script from `scripts/tools/` (e.g., `check_db_config.js`) after moving to ensure relative paths (`require('../../models/...')`) are correctly updated.
2.  **Lint/Syntax**: Check that no broken imports are introduced.

### Manual Verification
1.  **Core App**: Run `npm run dev` to ensure the main application still starts correctly.
2.  **Navigation**: Verify that the files in `docs/` are readable and properly formatted.
