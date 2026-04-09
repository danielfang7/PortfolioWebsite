---
title: "GladeCore"
description: "Powers games with local AI inference, TTS/STT, and custom model fine-tuning"
role: "Founder"
year: "2025"
stack: ["C++", "Unreal Engine", "Unity", "Piper"]
thumbnail: "/images/works/GladeCore_ProjectImage.png"
images:
  - "/images/works/GladeCore_ProjectImage_Detailed.png"
videos:
  - "/videos/works/GladeCore_Demo_Video.mp4"
featured: true
order: 2
caseStudy: "gladecore"
---

## Overview

GladeCore is a comprehensive system for integrating advanced, AI-driven NPC interactions into your game engine project. It allows players to engage in dynamic, unscripted conversations with non-player characters or companions using either text or voice. NPCs use local inference to respond in real-time, with their personalities, knowledge, and even their voices defined by easy-to-use data assets that are set up to be designed and configured in the engine.

## The Problem

1. **The Cost Model**

   Most commercial tools charge per token or per query. The more engaging the conversations are, the steeper the costs. While manageable at first, ultimately, this pricing model punishes success.

2. **Latency**

   Even under good conditions, cloud-based models introduce a heavy delay. In gameplay, that lag feels disruptive. It turns fluid conversation into awkward waiting, undermining any sense of presence, responsiveness, and immersion. The magic of real-time interaction disappears.

3. **Customization**

   Developers want their game characters to feel like they belong in their world, with specific voices, memories, and emotional arcs. But most tools offer limited control over how models behaved. Prompt engineering could only go so far, and vendor-controlled fine-tuning is often inaccessible or prohibitively complex.

4. **Integration Friction**

   Many AI solutions came with bulky SDKs that caused build issues, plugin conflicts, or version mismatches across all game engines. What should be plug-and-play often became weeks of debugging.

## What We Built

The plugin’s core features include:

- LLM-Powered Dialogue: Utilizes local LLM inference to generate dynamic NPC responses.
- Speech-to-Text (STT): Allows the player to use their microphone to speak to NPCs.
- Text-to-Speech (TTS): Enables NPCs to audibly speak their generated responses using either ElevenLabs’ cloud API or a local Piper TTS model
- Data-Driven Personalities: NPC personas, backstories, and voice settings are configured through Data Assets, allowing for easy customization without changing code.
- Retrieval Augmented Generation (Pro Subscribers Only): Store and retrieve knowledge to keep responses accurate, consistent, and grounded.
- Custom Model Fine-Tuning (Pro Subscribers Only): Finetune and integrate your own custom models of different sizes, emotions, and training data for even more personalization.
- Multiplayer Support (Enterprise Only): The architecture is built with networking in mind, using client-server RPCs to handle communication but is not implemented out of the box. 

Our base plugin supports Meta’s Llama 3.2 (1B or 3B) and ships with a default fine-tune targeting that model. You can swap in other models easily within our framework.

## Technical Details

### Architecture

The plugin is structured as **9 UE5 modules** with a clear load order. Runtime modules load in `PreDefault` phase to ensure native DLLs are staged before gameplay code initializes.

```
Microphone → Whisper STT → UChatComponent (Server RPC) → ULLMServiceManager
  → ULlamaComponent (llama.cpp streaming) → UTTSManager (ElevenLabs / Piper)
  → UChatComponent (Client RPC) → UTextToSpeechComponent (audio playback)
```

### LLM Inference

- **llama.cpp** runs GGUF models (Llama 3, Mistral, and others) entirely on-device via a thin C++ bridge (`LinkGGML`) that compiles and stages `llama.dll`, `whisper.dll`, and `ggml*.dll` at build time
- `ULLMTemplateHandler` subclasses implement correct prompt formatting per model family (ChatML/Llama3, Mistral Instruct, Minitron, or custom Jinja2)
- **Sentence-level streaming** — audio for the first sentence begins playing before the full LLM response is generated, minimizing perceived latency
- **Context window management** via `EContextResetPolicy` — four strategies (full reset, percent-of-messages, percent-of-tokens, fixed token count) run before each inference to prevent hitting model limits

### Speech-to-Text

- **Whisper.cpp** runs on a background thread, receiving 16 kHz float32 PCM streamed from the microphone via `UCapturableSoundWave`
- Push-to-talk lifecycle: key down starts capture; key release finalizes the Whisper pass and fires transcribed text into the chat pipeline
- Includes debounce (< 0.2s ignored), short-hold detection (< 0.5s = cancelled), and empty-audio validation to prevent spurious messages

### Text-to-Speech

**ElevenLabs (cloud):** LLM replies are segmented sentence-by-sentence before the full response finishes. Each sentence is dispatched as an HTTP POST; retriable errors (429, 5xx) use exponential backoff with jitter. Audio URLs are broadcast to clients via RPC — clients download and decode MP3 locally, keeping server bandwidth flat regardless of audio quality.

**Piper (local):** Voice models (`.onnx` + espeak-ng `.json`) are embedded as binary blobs inside `UPiperVoiceModelAsset` data assets. At runtime, ONNX Runtime synthesizes PCM on a background thread; raw int16 chunks are sent to clients via RPC and reassembled for sequential playback. Fully offline.

### Dynamic Personality

NPC traits (Affinity, Sarcasm, Trust, etc.) are defined as **emotion sliders** on `UNPCPersonalityData`. The resulting emotion line is injected into the system prompt at inference time, allowing gameplay events to shift NPC tone and behavior mid-conversation in real-time — not just at character creation.

