# E2E Navigation and Badge Test Suite

## Overview
This comprehensive test suite verifies complete navigation integrity and badge functionality across all public routes of the Truwit application.

## Test Files Created

### 1. `tests/helpers/test-utils.ts`
Utility functions for:
- Console error monitoring
- Spinner detection and waiting
- Badge image verification
- API integration for existing proofs
- Page integrity verification

### 2. `tests/e2e/navigation-integrity.spec.ts`
Comprehensive navigation tests:
- All public routes (`/`, `/verify`, `/t/:id`)
- Complete page loading verification
- Console error monitoring (fails on any error)
- Spinner hang detection
- Network failure monitoring
- Responsive design testing
- Browser navigation (back/forward)

### 3. `tests/e2e/badge-full-flow.spec.ts`
End-to-end badge flow tests:
- YouTube URL proof creation (`https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH`)
- Complete creation → verification flow
- Badge display verification
- Action button functionality
- Meta tag verification
- Error handling

### 4. `tests/e2e/dynamic-badge-component.spec.ts`
Focused badge component tests:
- Loading state verification
- Error state handling
- Multiple proof testing
- Network timeout handling
- Memory usage verification
- Accessibility features

## Configuration Updates

### `playwright.config.ts`
- Production environment support (`TEST_ENV=production`)
- Increased timeouts for badge operations
- Video recording for production tests
- Conditional web server (disabled for production)

### `package.json`
Added npm scripts:
- `test:e2e:prod` - Run all tests against production
- `test:e2e:prod:navigation` - Navigation tests only
- `test:e2e:prod:badge-flow` - Badge flow tests only
- `test:e2e:prod:badge-component` - Badge component tests only

## Running Tests

### Local Development
```bash
# Run all tests against localhost
npm run test:e2e

# Run specific test suites
npm run test:e2e:navigation
npm run test:e2e:badge-flow
npm run test:e2e:badge-component
```

### Production Testing
```bash
# Run all tests against production
npm run test:e2e:prod

# Run specific test suites against production
npm run test:e2e:prod:navigation
npm run test:e2e:prod:badge-flow
npm run test:e2e:prod:badge-component
```

### Debug Mode
```bash
# Debug against production
npm run test:e2e:prod:debug

# Debug specific test
TEST_ENV=production playwright test tests/e2e/badge-full-flow.spec.ts --debug
```

## Success Criteria

✅ **All routes load to `document.readyState === "complete"`**
✅ **Zero console errors in production**
✅ **No spinners visible after 10s timeout on any page**
✅ **Badge images load successfully (naturalWidth > 0)**
✅ **All network requests complete with status < 400**
✅ **Full creation → verification flow works end-to-end**
✅ **YouTube thumbnail link creates proof successfully**
✅ **Badge displays on verification page without errors**

## Test Coverage

### Navigation Tests
- Home page (`/`)
- Verification form (`/verify`)
- Public verification pages (`/t/:id`)
- Invalid proof IDs
- Browser navigation
- Responsive design
- Static asset loading

### Badge Flow Tests
- YouTube URL proof creation
- Badge display verification
- Action button functionality
- Meta tag verification
- Error handling
- Multiple proof creation

### Badge Component Tests
- Loading states
- Error states
- Network timeouts
- Memory usage
- Accessibility
- Edge cases

## Monitoring Features

### Console Error Detection
- Monitors all console messages
- Fails test on any error
- Allows warnings (configurable)
- Logs error details

### Network Failure Detection
- Monitors all HTTP responses
- Fails test on status ≥ 400
- Logs failed request details
- Tracks network performance

### Spinner Hang Detection
- Monitors loading indicators
- Fails test if spinner remains visible
- Supports multiple spinner selectors
- Configurable timeout

### Badge Image Verification
- Verifies image loads successfully
- Checks natural dimensions > 0
- Handles fallback scenarios
- Tests multiple viewports

## Environment Variables

- `TEST_ENV=production` - Run against production
- `BASE_URL` - Override base URL
- `CI=true` - CI environment settings

## Troubleshooting

### Common Issues
1. **Timeout errors**: Increase timeout in playwright.config.ts
2. **Network failures**: Check API availability
3. **Badge not loading**: Verify image URLs and fallbacks
4. **Console errors**: Check browser console for details

### Debug Commands
```bash
# Run with UI for visual debugging
npm run test:e2e:prod:ui

# Run specific test with debug
TEST_ENV=production playwright test tests/e2e/badge-full-flow.spec.ts --debug

# Generate detailed report
npm run test:e2e:report
```

## Implementation Notes

- Tests use real YouTube URL for proof creation
- Badge verification uses existing proof IDs from API
- Console monitoring prevents any JavaScript errors
- Network monitoring ensures API reliability
- Spinner detection prevents UI hangs
- Comprehensive error handling and fallbacks