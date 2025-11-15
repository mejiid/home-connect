# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Replaced `<img>` with Next.js `<Image>` component in hero component for better performance
- Improved TypeScript type safety by replacing `any` types with `unknown` and proper type guards
- Optimized React useEffect pattern in navbar component to prevent cascading renders

### Fixed
- Fixed all ESLint errors and warnings (17 errors, 7 warnings → 0 errors, 0 warnings)
- Fixed unescaped apostrophes in JSX content
- Fixed empty interface declaration in input component

### Removed
- Removed unused imports: Navbar, NavigationPromisesContext, useRouter
- Removed unused variable: isFetchingRole

### Security
- Added database files (*.db, *.db-shm, *.db-wal) to .gitignore to prevent sensitive data from being committed
- Ran CodeQL security analysis with 0 alerts found

### Documentation
- Added scripts/ directory to ESLint ignore list for CommonJS utility scripts
- Created CHANGELOG.md to track project changes
