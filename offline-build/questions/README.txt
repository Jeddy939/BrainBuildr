Question Set Swap Guide
======================

The game now loads quiz content from JSON files in this folder.

Files used by the app:
- manifest.json
- psychology_qcaa.json
- general_knowledge.json

How to swap to a different bank:
1. Add your new JSON file to this folder.
2. Ensure each question object includes:
   id, text, options, correctIndex, era
   optional: unit, topic, objectiveCode, explanation
3. Add an entry in manifest.json with:
   id, name, description, file
4. Reload the game and pick the set from Question Menu.

Optional direct launch override:
- Add URL query string: ?questions=<id>
  Example: ?questions=general_knowledge
