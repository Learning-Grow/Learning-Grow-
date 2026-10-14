StudyGlass - setup (Acode)
==========================
FILES (keep all in ONE folder): index.html, style.css, script.js, config.js, firestore.rules

QUICK TEST (no setup)
Open the folder in Acode and run the preview on index.html. With config.js left empty the app runs in LOCAL DEMO mode:
the Google button asks for a Gmail by typing; data stays on that phone. The first account created becomes admin.

REAL GOOGLE LOGIN + MEMBERS FOR EVERYONE (Firebase, free Spark plan)
1. console.firebase.google.com -> Add project.
2. Build -> Authentication -> Get started -> Sign-in method -> Google -> Enable.
3. Build -> Firestore Database -> Create database (production mode).
4. Firestore -> Rules: paste firestore.rules, change YOUR_GMAIL@gmail.com to your Gmail, Publish.
5. Project settings -> Your apps -> Web (</>) -> copy apiKey, authDomain, projectId, appId into config.js.
6. In config.js set ADMIN_EMAIL to the same Gmail.
7. Host the folder (Firebase Hosting, Netlify or GitHub Pages). Then Authentication -> Settings -> Authorized domains -> add your site domain.
   (Google popup does not work from file:// ; use https hosting or Acode's localhost preview.)

WHAT ONLY THE ADMIN CAN DO
Members list, site-wide settings (exam date, notice), removing members, deleting Learn library items.
Rules in firestore.rules enforce this on the server; hiding buttons alone would not be secure.
