---
name: afterdark
description: This compatibility skill should be used when the user invokes "/masque:afterdark", "/masque:afterdark flirty", "/masque:afterdark suggestive", "/masque:afterdark direct", or "/masque:afterdark off". It maps the former standalone Afterdark mode into the Masque afterdark profile.
version: 0.1.0
disable-model-invocation: true
argument-hint: [flirty|suggestive|direct|off]
---

# Afterdark Compatibility Alias

Map this command to the `afterdark` Masque profile.

```text
/masque:afterdark             = /masque:persona on afterdark:suggestive
/masque:afterdark flirty      = /masque:persona on afterdark:flirty
/masque:afterdark suggestive  = /masque:persona on afterdark:suggestive
/masque:afterdark direct      = /masque:persona on afterdark:direct
/masque:afterdark off         = /masque:persona off afterdark
```

Relay the hook-provided management result exactly. Do not treat activation alone as a request to generate a message. Apply the profile only when the user asks for adult consensual intimate-message drafting or revision.
