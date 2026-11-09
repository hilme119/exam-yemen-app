const https = require('https');

const projectId = 'yemen-national-exam-system';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/app_config?updateMask.fieldPaths=latestVersion&updateMask.fieldPaths=forceUpdate&updateMask.fieldPaths=downloadUrl&updateMask.fieldPaths=releaseNotes`;

// Since this is a public read collection for users, sometimes REST allows writes without auth if the rules are fully open, but here writes are likely restricted to authenticated users or admin. 
// We will try an alternative approach. 
// Since we have the firebase CLI installed on the system (which deploy used), we can just use python to execute a firebase CLI command if it supports setting data.
// Wait, `firebase firestore:databases:document settings/app_config` is not a valid firebase CLI command to SET data.
// Let's create an HTML file, open it in Chrome with the user's browser, and it will update the firestore since the user's browser is logged in, or we just generate the script for the user to run in the JS console.
