# AI Voice Specialist Vacancy: ASR/TTS Development

## Research Type: Manual / Job Vacancy

**Date:** 2026-03-27
**Salary:** По результатам собеседования
**Type:** Full-time Position

---

## Position Overview

Специалист по созданию ИИ с распознаванием/генерацией речи для голосовых ботов.

---

## Key Requirements

### 1. ASR/TTS Experience

| Requirement | Description |
|-------------|-------------|
| Real-time speech streams | Управление потоками речи в реальном времени |
| Context recovery | Корректное восстановление контекста после прерывания |
| Timing coordination | Согласование таймингов между распознаванием, ответом и синтезом |

### 2. Technical Skills

| Skill | Level |
|-------|-------|
| Python | Professional |
| AI/ML | Professional |
| System architecture | Strong |

### 3. Architecture Design

| Requirement | Description |
|-------------|-------------|
| Multi-component services | Многокомпонентные сервисы |
| API interfaces | API-интерфейсы |
| Management tools | Инструменты управления и автоматизации |

### 4. Integration Skills

| Integration | Purpose |
|-------------|---------|
| ASR providers | Speech recognition |
| TTS providers | Speech synthesis |
| LLM providers | Language understanding |
| Noise filter | Audio preprocessing |

### 5. Testing Skills

| Requirement | Description |
|-------------|-------------|
| Auto-testing in text | Автотестирование в тексте |
| Auto-testing in voice | Автотестирование в голосе |

### 6. Bonus Skills

| Skill | Description |
|-------|-------------|
| Multimodal systems | Обработка текста, аудио |
| Multimodal models | Интеграция мультимодальных моделей |

---

## Technical Architecture for Voice Bots

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Voice Bot Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   Audio  │───▶│  Noise   │───▶│   ASR    │              │
│  │  Input   │    │  Filter  │    │ (STT)    │              │
│  └──────────┘    └──────────┘    └──────────┘          │
│         │                                               │
│         ▼                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Dialog   │◀──▶│   LLM    │◀──▶│ Context  │              │
│  │ Manager  │    │          │    │ Manager  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│         │                                               │
│         ▼                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Response │───▶│   TTS    │───▶│  Audio   │              │
│  │ Generator│    │          │    │ Output   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Technical Challenges

### 1. Real-Time Speech Streaming

| Challenge | Solution |
|-----------|----------|
| Low latency | WebSocket connections |
| Buffer management | Ring buffers |
| Partial results | Streaming ASR |

```python
# Example: Streaming ASR with context handling
class StreamingASR:
    def __init__(self):
        self.buffer = RingBuffer(max_size=1024)
        self.context = ConversationContext()
    
    async def process_stream(self, audio_stream):
        async for chunk in audio_stream:
            # Noise filtering
            clean_audio = self.noise_filter.process(chunk)
            
            # Streaming recognition
            partial = await self.asr.recognize_streaming(clean_audio)
            
            # Check for interruption
            if self.detect_interruption(partial):
                self.context.handle_interruption()
                yield self.generate_response(partial, interrupted=True)
            else:
                if partial.is_final:
                    response = await self.llm.generate(partial.text, self.context)
                    yield response
```

### 2. Context Recovery After Interruption

```
Problem: User interrupts AI mid-sentence
Solution: 
- Maintain conversation state
- Quick context switch
- Resume from last complete thought
```

```python
class ConversationContext:
    def __init__(self):
        self.history = []
        self.current_intent = None
        self.interruption_count = 0
    
    def handle_interruption(self, user_input):
        # Save pre-interruption state
        self.save_checkpoint()
        
        # Process new input
        new_intent = self.intent_classifier.classify(user_input)
        
        # Decide: continue previous or switch
        if self.is_related(new_intent, self.current_intent):
            return self.continue_with_context(new_intent)
        else:
            return self.switch_context(new_intent)
```

### 3. Timing Coordination

| Component | Latency Target |
|-----------|----------------|
| Noise filter | < 50ms |
| ASR | < 300ms |
| LLM | < 500ms |
| TTS | < 200ms |
| **Total** | **< 1000ms** |

```python
# Timing-aware response generation
class TimingCoordinator:
    async def generate_response(self, intent, context):
        # Start TTS preparation while LLM processes
        llm_task = self.llm.generate(intent, context)
        tts_preparation = self.tts.preprocess()
        
        # Wait for LLM
        response = await llm_task
        
        # Quick TTS (already preprocessed)
        audio = await self.tts.synthesize(response)
        
        return audio
```

---

## ASR/TTS Providers

### ASR (Speech-to-Text)

| Provider | Latency | Quality | Cost |
|----------|---------|---------|------|
| OpenAI Whisper | ~200ms | High | Medium |
| Google STT | ~300ms | High | Medium |
| Azure Speech | ~250ms | High | Medium |
| Deepgram | ~100ms | High | Low |
| Yandex SpeechKit | ~200ms | High (RU) | Medium |
| Sber Speech | ~200ms | High (RU) | Medium |

### TTS (Text-to-Speech)

| Provider | Latency | Naturalness | Cost |
|----------|---------|-------------|------|
| OpenAI TTS | ~300ms | High | Medium |
| ElevenLabs | ~400ms | Very High | High |
| Azure Speech | ~200ms | High | Medium |
| Google TTS | ~300ms | Medium | Low |
| Yandex SpeechKit | ~200ms | High (RU) | Medium |

---

## System Architecture Example

```python
# Voice Bot System Architecture

class VoiceBot:
    def __init__(self):
        self.asr = ASRProvider()  # Whisper/Deepgram/etc.
        self.tts = TTSProvider()  # ElevenLabs/OpenAI/etc.
        self.llm = LLMProvider()  # OpenAI/Claude/etc.
        self.noise_filter = NoiseFilter()
        self.context = ConversationContext()
        self.timing = TimingCoordinator()
    
    async def handle_call(self, audio_stream):
        """Main call handling loop"""
        async for user_audio in audio_stream:
            # 1. Noise filtering
            clean_audio = self.noise_filter.process(user_audio)
            
            # 2. Speech recognition
            transcript = await self.asr.transcribe(clean_audio)
            
            # 3. Intent detection
            intent = self.detect_intent(transcript)
            
            # 4. Handle interruption
            if self.is_interruption(transcript):
                self.context.handle_interruption()
            
            # 5. Generate response
            response = await self.timing.coordinate(
                self.llm.generate(intent, self.context),
                self.tts.preprocess()
            )
            
            # 6. Synthesize speech
            audio_response = await self.tts.synthesize(response)
            
            # 7. Update context
            self.context.update(transcript, response)
            
            yield audio_response
```

---

## Testing Strategies

### Text-Based Testing

```python
# Unit tests for dialog logic
def test_intent_classification():
    bot = VoiceBot()
    intent = bot.detect_intent("How much does it cost?")
    assert intent == "pricing_inquiry"

def test_context_recovery():
    bot = VoiceBot()
    bot.context.set_topic("product_info")
    
    # Simulate interruption
    response = bot.handle_interruption("Wait, what about delivery?")
    assert bot.context.current_topic == "delivery"
```

### Voice-Based Testing

```python
# Integration tests with real ASR/TTS
async def test_full_conversation():
    bot = VoiceBot()
    
    # Simulate call
    audio_input = load_test_audio("test_conversation.wav")
    
    responses = []
    async for response in bot.handle_call(audio_input):
        responses.append(response)
    
    assert len(responses) > 0
    assert all(r.duration < 30 for r in responses)  # Reasonable duration
```

---

## Market Context

### Salary Expectations (Russia)

| Level | Monthly Salary (₽) |
|-------|-------------------|
| Junior | 80,000 - 150,000 |
| Middle | 150,000 - 300,000 |
| Senior | 300,000 - 500,000 |
| Lead/Architect | 400,000 - 700,000 |

### Salary Expectations (International)

| Level | Annual Salary ($)|
|-------|------------------|
| Junior | $40,000 - $70,000 |
| Middle | $70,000 - $120,000 |
| Senior | $120,000 - $200,000 |
| Lead | $180,000 - $300,000 |

---

## Key Skills Assessment

| Skill | Assessment Method |
|-------|-------------------|
| Python | Code review, system design |
| ASR/TTS | Technical interview |
| Architecture | System design interview |
| Integration | Past projects review |
| Testing | Test strategy discussion |

---

*Manual Research Entry*
*Date Added: 2026-03-27*
*Type: Job Vacancy*