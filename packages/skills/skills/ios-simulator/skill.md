# iOS Simulator Skill

Build, test, and automate iOS applications using accessibility-driven navigation and structured data.

## Prerequisites

- macOS with Xcode installed
- iOS Simulator
- Python 3.8+

## Instructions

### Quick Start

```bash
# 1. Check environment
bash scripts/sim_health_check.sh

# 2. Launch app
python scripts/app_launcher.py --launch com.example.app

# 3. Map screen to see elements
python scripts/screen_mapper.py

# 4. Tap button
python scripts/navigator.py --find-text "Login" --tap

# 5. Enter text
python scripts/navigator.py --find-type TextField --enter-text "user@example.com"
```

### 21 Production Scripts

**Build & Development (2)**
- `build_and_test.py` - Build Xcode projects, run tests, parse results
- `log_monitor.py` - Real-time log monitoring with filtering

**Navigation & Interaction (5)**
- `screen_mapper.py` - Analyze screen and list interactive elements
- `navigator.py` - Find and interact with elements semantically
- `gesture_performer.py` - Swipes, pinches, long press
- `keyboard_handler.py` - Text input and keyboard management
- `alert_handler.py` - Handle system dialogs

**State & Verification (4)**
- `state_inspector.py` - App state, hierarchy, properties
- `screenshot_capture.py` - Screenshots with annotations
- `accessibility_auditor.py` - WCAG compliance checking
- `performance_monitor.py` - CPU, memory, network metrics

**Simulator Management (4)**
- `sim_controller.py` - Boot, shutdown, reset simulators
- `app_manager.py` - Install, uninstall, manage apps
- `settings_manager.py` - Configure simulator settings
- `location_manager.py` - Set GPS coordinates

**Data & Files (3)**
- `data_manager.py` - App data, UserDefaults, databases
- `file_browser.py` - Browse app sandbox
- `network_monitor.py` - HTTP traffic inspection

**Utilities (3)**
- `deeplink_tester.py` - Test URL schemes
- `push_simulator.py` - Simulate push notifications
- `biometric_handler.py` - Face ID/Touch ID simulation

All scripts support `--help` and `--json` for machine-readable output.

## Guidelines

1. Use semantic navigation (text, accessibility ID) over coordinates
2. Always check environment with health_check first
3. Use `--json` flag for automation pipelines
4. Map screen before interacting with elements
5. Handle alerts and keyboards explicitly

## Notes

- Optimized for AI agents with minimal token output
- Accessibility-driven navigation is more reliable
- Progressive disclosure in build output

Source: conorluddy/ios-simulator-skill
