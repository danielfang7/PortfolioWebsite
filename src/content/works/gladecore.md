---
title: "GladeCore"
description: "LLM powered plugin with built in text-to-speech, speech-to-text, emotional tuning, and RAG"
role: "Founder"
year: "2025"
stack: ["C++", "Unreal Engine", "Unity", "Piper"]
thumbnail: "/images/works/GladeCore_ProjectImage.png"
images: []
featured: true
order: 2
---

## Overview

GladeCore is a comprehensive system for integrating advanced, AI-driven NPC interactions into your game engine project. It allows players to engage in dynamic, unscripted conversations with non-player characters or companions using either text or voice. NPCs use local inference to respond in real-time, with their personalities, knowledge, and even their voices defined by easy-to-use data assets that are set up to be designed and configured in the engine.

## The Problem

1. The Cost Model
Most commercial tools charge per token or per query. The more engaging the conversations are, the steeper the costs. While manageable at first, ultimately, this pricing model punishes success.

2. Latency
Even under good conditions, cloud-based models introduce a 1-3 second delay. In gameplay, that lag feels disruptive. It turns fluid conversation into awkward waiting, undermining any sense of presence, responsiveness, and immersion. The magic of real-time interaction disappears.

3. Customization
The key to successful AI asset generation is writing clear, descriptive prompts. Here are some tips:

We wanted our characters to feel like they belonged in our world, with specific voices, memories, and emotional arcs. But most tools offered limited control over how the model behaved. Prompt engineering could only go so far, and vendor-controlled fine-tuning was often inaccessible or prohibitively complex.

4. Integration Friction
Many AI solutions came with bulky SDKs that caused build issues, plugin conflicts, or version mismatches across all game engines. What should have been plug-and-play often became weeks of debugging.

5. Connectivity and Privacy
Without an internet connection, the AI didn’t function at all. All interactions are routed through third-party servers, which also raises red flags for accessibility, privacy, and global compliance. For games launched in Europe or any GDPR-enforced region, transmitting player voice or text data to cloud services can trigger strict rules around consent, data storage, and cross-border transfers. With little transparency in data retention and processing, these systems made global compliance difficult and risky.

## What I Built

The plugin’s core features include:

LLM-Powered Dialogue: Utilizes local LLM inference to generate dynamic NPC responses.
Speech-to-Text (STT): Allows the player to use their microphone to speak to NPCs.
Text-to-Speech (TTS): Enables NPCs to audibly speak their generated responses using either ElevenLabs’ cloud API or a local Piper TTS model
Data-Driven Personalities: NPC personas, backstories, and voice settings are configured through Data Assets, allowing for easy customization without changing code.
Retrieval Augmented Generation (Pro Subscribers Only): Store and retrieve knowledge to keep responses accurate, consistent, and grounded.
Custom Model Fine-Tuning (Pro Subscribers Only): Finetune and integrate your own custom models of different sizes, emotions, and training data for even more personalization.
Multiplayer Support (Enterprise Only): The architecture is built with networking in mind, using client-server RPCs to handle communication but is not implemented out of the box. 

Our base plugin supports Meta’s Llama 3.2 (1B or 3B) and ships with a default fine-tune targeting that model. You can swap in other models easily within our framework.

## Technical Details

