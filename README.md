# Offline Speaker Diarization – MVP Module  
### NeMo Telephonic Diarization + Silero VAD (2-Speaker, Offline)

This module implements an **offline speaker diarization pipeline** for the Meeting Protocol System.  
It uses **Silero VAD** for speech segmentation and **NeMo Telephonic Diarization**  
(TitaNet embeddings + clustering) to produce reliable 2-speaker diarization.

The output includes **RTTM** and a clean **JSON** segment list suitable for frontend timeline editors.

---

## 🚀 Features

- **Fixed 2-speaker** diarization (deterministic and stable for MVP)
- Silero VAD preprocessing
- NeMo TitaNet + clustering (telephonic settings)
- Outputs:
  - `*.rttm`
  - `*.json`
- CLI for single-file and batch processing
- Integration-friendly Python function (`diarize_file`)
- CUDA-compatible, tested on **Torch 2.8.0 + cu126**

---

## 📁 Input → Output Flow

```
Audio (.wav / .mp3 / .m4a)
        ↓
Silero VAD → timestamps
        ↓
NeMo Clustering Diarizer (TitaNet)
        ↓
RTTM
        ↓
JSON (speaker segments)
```

Example JSON:
```json
[
  {
    "file_id": "meeting01",
    "speaker": "SPEAKER_00",
    "start": 0.12,
    "end": 3.95,
    "duration": 3.83
  },
  {
    "file_id": "SPEAKER_01",
    "speaker": "SPEAKER_01",
    "start": 4.02,
    "end": 8.10,
    "duration": 4.08
  }
]
```

---

## 📦 Installation

### 1. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

> Requires CUDA 12.6 for GPU mode.

---

## ▶️ Usage

### **1. Diarize a single audio file**
```bash
python diar_offline_mvp.py --audio path/to/file.wav
```

Output will be saved to:
```
diar_output/
  ├── file.rttm
  └── file.json
```

### **2. Diarize an entire folder**
```bash
python diar_offline_mvp.py --input_dir ./audios --pattern "*.wav"
```

---

## 🔌 Integration Notes (Backend)

### The backend workflow:

1. User uploads video → backend extracts audio (ffmpeg)
2. Backend calls:
   ```python
   result = diarize_file("/path/audio.wav")
   ```
3. Script returns dict:
   ```python
   {
     "rttm_path": "...",
     "json_path": "...",
     "segments": [...]
   }
   ```
4. Backend stores:
   - JSON in PostgreSQL
   - Transcription + diarization metadata
   - RTTM as optional debug artifact

### Expected FastAPI integration pseudocode:
```python
from diar_offline_mvp import diarize_file

@app.post("/diarize")
def diarize_endpoint(file: UploadFile):
    audio_path = save_temp(file)
    result = diarize_file(audio_path)
    return result["segments"]
```

---

## 🗂 Directory Structure

```
project/
│
├── diar_offline_mvp.py        # Main script
├── requirements.txt
├── README.md
├── diar_output/               # RTTM/JSON result files
└── temp_inference_output/     # NeMo temporary directory
```

---

## ⚠️ Limitations (MVP Scope)

- Only **2 speakers** (fixed)
- Offline processing only
- No real-time streaming diarization
- No multi-speaker (>2) clustering
- No speaker naming / gender detection
- Telephonic model (works fine for meetings, but not perfect)

---

## 🔧 Troubleshooting

### VAD detects nothing:
```
--vad_threshold 0.3
```

### Segments look too short or too long:
Tune:
- `--vad_min_on`
- `--vad_min_off`

### CUDA OOM:
```
export TORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
```

---

## 👥 Maintainers

**ML Team • Diarization / ASR • Muxlisa AI**
