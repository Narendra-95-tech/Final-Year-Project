# 📱 WanderLust Mobile App Setup Guide

This guide explains how to build the Android app for your WanderLust project using Capacitor.

## 🚀 Prerequisite: Android Studio
To build the `.apk` file, you need to have **Android Studio** installed on your computer.
[Download Android Studio](https://developer.android.com/studio)

## ⚙️ Step 1: Configure Your Server URL

Since WanderLust runs on your computer (Node.js), the mobile app needs to know where to connect.

1. **Find your computer's Grid IP address**:
   - Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.5` or similar)

2. **Update `capacitor.config.json`**:
   - Open `capacitor.config.json` in VS Code.
   - Change the `"url"` field to your IP address:
     ```json
     "server": {
       "url": "http://YOUR_IPv4_ADDRESS:8080", 
       "cleartext": true
     }
     ```
   - **Crucial**: Make sure your phone and computer are on the **same Wi-Fi network**.

## 🛠️ Step 2: Sync and Open Android Project

Run these commands in your VS Code terminal:

```bash
# Sync configuration to Android project
npx cap sync

# Open the project in Android Studio
npx cap open android
```

## 🏗️ Step 3: Build the APK

1. When **Android Studio** opens, wait for it to index the project (Gradle sync).
2. Connect your Android phone via USB (enable "USB Debugging" in Developer Options on your phone).
3. Click the **Run (Green Play Button)** in Android Studio to install the app directly on your phone.

**OR** to build an APK file to share:
1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Once done, a notification will appear. Click "locate" to find your `.apk` file.
3. You can send this file to any Android phone to install!

## 📦 For Production (Live Website)

If you deploy WanderLust to the web (e.g., Render, Heroku), update `capacitor.config.json` to your live URL:

```json
"server": {
  "url": "https://your-wanderlust-app.onrender.com",
  "cleartext": true
}
```

Then run `npx cap sync` and rebuild the app. This allows anyone to use the app without being on your specific Wi-Fi.

## 🎨 App Icons & Splash Screen

To customize icons:
1. Place your icon (1024x1024 png) and splash screen (2732x2732 png) in a `resources` folder.
2. Install `cordova-res`: `npm install -g cordova-res`
3. Run: `cordova-res android --skip-config --copy`
