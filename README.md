# 🛡️ Steganalysis Through Social Media (Stego-Chat)

An intelligent real-time chat application integrated with Deep Learning-based Steganalysis (SRNet) to detect steganographic payloads in images shared across social communication channels.

---

## 📌 Overview

Stego-Chat combines a real-time messaging platform (WebSockets) with an automated image steganography detection pipeline. When images are sent between users in chat, the backend runs deep learning inference using **SRNet** (Spatial Rich Model Convolutional Neural Network) to inspect whether the image contains hidden data (cover vs. stego image).

---

## ✨ Features

- **Real-Time Messaging**: Built with React and Flask-SocketIO for instant two-way chat communication.
- **Deep Steganalysis Pipeline**: Integrated with SRNet to automatically evaluate uploaded images for hidden steganographic content.
- **User Authentication**: Simple user registration and login with secure credential handling and session persistence.
- **Active User Search & Presence**: Search registered users and see online status in real-time.
- **Image Sharing & Inspection**: Seamless file upload with instant verification and feedback.

---

## 📁 Project Structure

```
stego-chat/
├── backend/
│   ├── Deep-steganalysis/          # SRNet model definition, training & utilities
│   │   ├── models/                 # Model architecture (SRNet)
│   │   ├── utils/                  # Dataset loaders, loggers, monitors
│   │   ├── config.py               # Hyperparameters and configurations
│   │   └── srnet.py                # Training and validation routines
│   ├── app.py                      # Flask + Socket.IO server & REST endpoints
│   ├── database.py                 # SQLite database management
│   ├── srnet_inference.py          # Image inference & steganalysis classification
│   ├── best_model_SRNet.pt         # Pretrained SRNet weights
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── public/                     # Public static assets
│   ├── src/
│   │   ├── App.jsx                 # Main application view switcher
│   │   ├── Chat.jsx                # Real-time chat interface & socket handler
│   │   ├── Login.jsx               # Login & Registration component
│   │   └── index.js                # React root entry point
│   └── package.json                # Frontend dependencies and scripts
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.9+ installed
- **Node.js**: v18+ and `npm` installed
- **PyTorch**: Recommended with CUDA if GPU inference is desired

---

### Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   python app.py
   ```
   The Flask server will start on `http://localhost:5000`.

---

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`.

---

## 🧠 Model Architecture

The steganalysis engine is powered by **SRNet** (State-of-the-Art Deep Learning Model for Image Steganalysis), designed specifically to detect subtle statistical modifications introduced by spatial domain steganography algorithms (such as WOW, S-UNIWARD, and HILL).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
