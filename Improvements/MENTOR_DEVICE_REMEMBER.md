# Mentor mode — remember on device

After admin completes **one** Firebase SMS OTP unlock:
- `localStorage` key `vks_mentor_mode_device_8929397949` stores `{ mobile, at, expires }`
- Also mirrored to parent Man Power `localStorage` when Mentor runs in iframe
- TTL: **180 days**
- On next open (same device/browser/WebView profile): mentor mode auto-enables (silent)
- Turning mentor mode **off** via key icon clears the device memory (OTP required again)

**Firebase rules:** no change required (device-only memory).
