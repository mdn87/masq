---
name: afterdark
description: This compatibility skill should be used when the user invokes "/masq:afterdark", "/masq:afterdark flirty", "/masq:afterdark suggestive", "/masq:afterdark direct", or "/masq:afterdark off". It maps the former standalone Afterdark mode into the Masq afterdark profile.
version: 0.1.0
disable-model-invocation: true
argument-hint: [flirty|suggestive|direct|off]
---

# Afterdark Compatibility Alias

Map this command to the `afterdark` Masq profile.

```text
/masq:afterdark             = /masq:persona on afterdark:suggestive
/masq:afterdark flirty      = /masq:persona on afterdark:flirty
/masq:afterdark suggestive  = /masq:persona on afterdark:suggestive
/masq:afterdark direct      = /masq:persona on afterdark:direct
/masq:afterdark off         = /masq:persona off afterdark
```

Relay the hook-provided management result exactly. Do not treat activation alone as a request to generate a message. Apply the profile only when the user asks for adult consensual intimate-message drafting or revision.
