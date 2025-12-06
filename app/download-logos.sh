#!/bin/bash
# Download AI provider logos using Clearbit Logo API
# Run this script from the liquid_snake/img/ai-logos/ directory

echo "📥 Downloading AI provider logos..."

# OpenAI
curl -s -o openai.png "https://logo.clearbit.com/openai.com" && echo "✅ openai.png downloaded"

# Anthropic
curl -s -o anthropic.png "https://logo.clearbit.com/anthropic.com" && echo "✅ anthropic.png downloaded"

# Google (for Gemini)
curl -s -o gemini.png "https://logo.clearbit.com/google.com" && echo "✅ gemini.png downloaded"

# xAI (Grok)
curl -s -o grok.png "https://logo.clearbit.com/x.ai" && echo "✅ grok.png downloaded"

# Mistral AI
curl -s -o mistral.png "https://logo.clearbit.com/mistral.ai" && echo "✅ mistral.png downloaded"

# Cohere
curl -s -o cohere.png "https://logo.clearbit.com/cohere.com" && echo "✅ cohere.png downloaded"

# Perplexity AI
curl -s -o perplexity.png "https://logo.clearbit.com/perplexity.ai" && echo "✅ perplexity.png downloaded"

# Groq
curl -s -o groq.png "https://logo.clearbit.com/groq.com" && echo "✅ groq.png downloaded"

# DeepSeek
curl -s -o deepseek.png "https://logo.clearbit.com/deepseek.com" && echo "✅ deepseek.png downloaded"

# OpenRouter
curl -s -o openrouter.png "https://logo.clearbit.com/openrouter.ai" && echo "✅ openrouter.png downloaded"

# Together AI
curl -s -o together.png "https://logo.clearbit.com/together.ai" && echo "✅ together.png downloaded"

# Replicate
curl -s -o replicate.png "https://logo.clearbit.com/replicate.com" && echo "✅ replicate.png downloaded"

# Hugging Face
curl -s -o huggingface.png "https://logo.clearbit.com/huggingface.co" && echo "✅ huggingface.png downloaded"

# Custom (use placeholder)
cp placeholder.svg custom.png 2>/dev/null || echo "⚠️  Create custom.png manually"

echo ""
echo "🎉 Logo download complete!"
echo "ℹ️  If any logos are missing or incorrect, download them manually from company websites."
