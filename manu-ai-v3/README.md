# MANU AI

A production-ready React Native Android app with AI chat, voice control, 3D avatar, and ethical hacking tools.

## Features

- OpenAI Chat with streaming (GPT-4o-mini)
- Voice control in Hindi and English
- 3D avatar with lip sync and emotion detection
- Ethical hacking tools (password analyzer, hash generator, phishing detector, etc.)
- AdMob integration (Banner + Rewarded ads)
- Voice fingerprint authentication
- Installed apps intelligence with deep linking

## Setup

1. Clone the repository
2. Run `yarn install`
3. Add your OpenAI API key in Settings screen
4. Build with `./gradlew assembleRelease` in the `android` directory

## GitHub Actions Build

The included workflow automatically builds a signed APK on push to main/master.

Required secrets:
- `KEYSTORE_BASE64`: Base64-encoded release keystore
- `STORE_PASSWORD`: Keystore password
- `KEY_ALIAS`: Key alias
- `KEY_PASSWORD`: Key password

## Dependencies

See `package.json` for the full list. All dependencies are carefully chosen to avoid Android build conflicts.

## License

MIT
