---
"@codefast/tracking": patch
---

Default `engagement_time_msec` on Measurement Protocol events to 100ms — the fallback Google's own MP documentation prescribes when the elapsed time since the previous event is unknown — instead of 1ms.
