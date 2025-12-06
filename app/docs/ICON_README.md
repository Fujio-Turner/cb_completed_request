# AI Provider Logos

This directory contains logos for AI service providers used in the Settings modal.

## Required Logo Files

All logos should be **PNG format, 128x128px or similar square dimensions**, with transparent backgrounds where possible.

### Logo Sources

| File Name | Provider | Logo Source |
|-----------|----------|-------------|
| `openai.png` | OpenAI | https://openai.com/brand |
| `anthropic.png` | Anthropic Claude | https://www.anthropic.com/brand |
| `gemini.png` | Google Gemini | https://ai.google.dev/ (use Google AI logo) |
| `grok.png` | xAI Grok | https://x.ai/ |
| `mistral.png` | Mistral AI | https://mistral.ai/company/ |
| `cohere.png` | Cohere | https://cohere.com/ |
| `perplexity.png` | Perplexity AI | https://www.perplexity.ai/ |
| `groq.png` | Groq | https://groq.com/ |
| `deepseek.png` | DeepSeek | https://www.deepseek.com/ |
| `openrouter.png` | OpenRouter | https://openrouter.ai/ |
| `together.png` | Together AI | https://www.together.ai/ |
| `replicate.png` | Replicate | https://replicate.com/ |
| `huggingface.png` | Hugging Face | https://huggingface.co/brand |
| `custom.png` | Custom API | Use generic API icon (gear, wrench, etc.) |

## Quick Download Guide

### Option 1: Download from Company Websites
1. Visit each company's website or brand page
2. Download their logo (PNG format preferred)
3. Resize to 128x128px if needed
4. Save with the exact filename listed above

### Option 2: Use Favicon Services
You can use services like:
- https://logo.clearbit.com/{domain}
- https://www.google.com/s2/favicons?domain={domain}&sz=128

Example:
```bash
# Download OpenAI logo
curl -o openai.png "https://logo.clearbit.com/openai.com"

# Download Anthropic logo
curl -o anthropic.png "https://logo.clearbit.com/anthropic.com"

# Download Hugging Face logo
curl -o huggingface.png "https://logo.clearbit.com/huggingface.co"
```

### Option 3: Manual Collection
1. Use browser DevTools to find logo images on company websites
2. Right-click → Save Image As
3. Crop/resize to square dimensions if needed

## Design Guidelines

- **Size**: 128x128px recommended (will be scaled to 28x28px in UI)
- **Format**: PNG with transparent background
- **Colors**: Original brand colors (no modifications)
- **Style**: Official company logos only
- **Quality**: High-resolution source for crisp rendering

## Fallback Behavior

If a logo file is missing, the `onerror` handler will hide the image and only show the provider name.

## License Notes

⚠️ **Important**: Logo images are trademarks of their respective companies. Use only for identification purposes in accordance with each company's brand guidelines.
