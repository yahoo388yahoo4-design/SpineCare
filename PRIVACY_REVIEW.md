# Privacy review

- No patient reports, medical images, patient identifiers, or patient-specific findings are included.
- No backend, analytics, account system, or automatic upload path is implemented.
- Users can explicitly open the device share sheet to export CSV-formatted session/check-in data. Shared content may leave the device if the user selects another app or recipient; notes may contain sensitive health information, so avoid identifiers and review the export before sharing.
- Camera is used only for a live preview; no recording or upload is implemented.
- The app is a prototype and does not perform automatic pose analysis or clinical assessment.
- Do not commit patient data, signing keys, API tokens, provisioning profiles, or health records.
- The build pipeline uploads only the generated APK as a GitHub Actions artifact.
