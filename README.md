# Blinky Angel 👁️✨  
*A Chrome extension that helps you blink more, rest your eyes, and reduce digital eye strain.*

---

## 🧠 Problem Summary

When we stare at screens, our natural blink rate drops from about **15–20 blinks/minute** to as low as **5–7 blinks/minute**. This reduced blinking leads to **dry eyes, headaches, blurred vision, and digital eye strain**, especially for:

- Students and remote workers with long screen hours  
- Neurodivergent users who hyperfocus  
- Low-vision users who rely heavily on screens  
- Anyone working in front of a monitor for extended periods  

Most people **don’t notice when they stop blinking** — so they can’t correct it.

**Blinky Angel** is a small, friendly Chrome extension that runs alongside your browser, helps you maintain healthy blinking habits, and gently nudges you to follow the **20-20-20 rule** (every 20 minutes, look 20 feet away for 20 seconds).

---

## ✨ What Blinky Angel Does

- Uses **webcam + TensorFlow.js** to estimate your **blink rate in real time**  
- Gently reminds you to blink if your blink rate stays low for a period of time  
- Supports different reminder modes: **Strict**, **Balanced**, and **Gentle**  
- Automatically applies the **20-20-20 rule**:
  - Every 20 minutes, it prompts you to look away for 20 seconds  
- Shows a small on-screen character (“Blinky Angel”) that:
  - Appears at the edge of your screen  
  - Animates to get your attention when it’s time to blink or take a break  

All processing is done **on-device** in your browser. No images or data are sent to a server.

---

## 🧰 Tech Stack

- **Chrome Extension (Manifest V3)**  
- **HTML, CSS, JavaScript**  
- **TensorFlow.js** (via CDN) for real-time image/eye analysis  
- Basic timers + state stored locally (Chrome storage or in-memory)

---

## 🚀 Getting Started (Run it Locally as an Unpacked Extension)

Follow these steps to download and run Blinky Angel on your own computer.

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/sonya-q/blinky-angel.git

```

Then go into the project folder:

```bash
cd blinky-angel
```

If you downloaded a ZIP file instead of using git clone, just unzip it and remember the folder location.

### 2. Load as an Unpacked Chrome Extension

Load as an Unpacked Chrome Extension

Open Google Chrome.

Go to:
```bash
chrome://extensions/
```

Turn on Developer mode (toggle in the top-right corner).

Click “Load unpacked”.

In the file picker, select and open the folder "blinky-angel" from wherever you saved it.

You should now see “Blinky Angel” appear in your list of extensions.

4. Grant Permissions & Start Using

Make sure the extension is enabled (toggle in chrome://extensions is on).

Pin it for easy access:

Click the puzzle piece icon (Extensions) beside the Chrome address bar

Click the pin icon next to Blinky Angel

When you start using it for the first time:

The extension may ask for camera access (for blink detection)

Click “Allow” so TensorFlow.js can analyze your eyes in real time

Once enabled, the extension will:

* Inject a small Blinky Angel widget into your active tabs

* Start monitoring your blinking (when you have the browser focused)

* Gently remind you to blink and follow the 20-20-20 rule

### 🧪 How It Works (High-Level)

1. Webcam Stream

* The extension requests permission to use your webcam

* Frames are processed directly in your browser

2. TensorFlow.js Model

* TensorFlow.js (loaded via CDN) runs a pre-trained model

* It detects your face/eyes and outputs facial landmark positions

3. Blink Detection Logic

* From the eye landmarks, we compute an eye aspect ratio (EAR)

* When EAR drops briefly below a threshold → we count a blink

* We track blinks over time to estimate blinks per minute

4. Health Logic & Reminders

* If blink rate stays too low for too long, Blinky Angel appears and reminds you to blink

* Every 20 minutes, it triggers the 20-20-20 reminder

* Different modes adjust how frequently reminders appear

* All of this happens locally in your browser tab.

### 🔒 Privacy

Video frames are processed locally in your browser using TensorFlow.js

No images, video, or blink data are sent to any external servers

This extension is designed as a wellness tool, not a data collection tool

## Authors
Ariel Liu, Sonya Cheng Qu
