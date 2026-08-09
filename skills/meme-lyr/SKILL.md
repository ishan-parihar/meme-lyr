---
name: meme-lyr
description: Generate memes and slides for social media using the meme-lyr CLI tool. Use this skill whenever the user requests memes, image content, visual posts, carousel slides, or any social media imagery. Triggers on phrases like "create a meme", "make a slide", "generate visual content", "social media image", "Instagram story", "Facebook post", "carousel content", or any request for visual/graphics creation. The skill handles aspect ratio selection automatically: use 9:16 for stories, 4:5 for posts/carousel, and only use 1:1 on request.
---

# Meme-lyr Skill

This skill enables AI agents to generate memes and slides for social media using the meme-lyr CLI tool. It handles aspect ratio selection, template selection, and text placement automatically.

## Prerequisites

- meme-lyr CLI must be installed globally on the system
- ImgFlip credentials must be configured in `~/.meme-lyr/config.json` or as environment variables
- The CLI must be accessible in the system PATH

## Aspect Ratio Selection Logic

**CRITICAL**: Always apply this aspect ratio logic unless the user explicitly specifies otherwise:

### Automatic Aspect Ratio Selection

1. **Stories** (Instagram Stories, Facebook Stories, TikTok): Use `9:16`
   - Triggers: "story", "stories", "vertical video", "portrait format"
   - Dimensions: 1080x1920
   - Platform compatibility: Instagram Stories, Facebook Stories, TikTok

2. **Posts/Carousel** (Instagram Feed, Facebook Feed, LinkedIn): Use `4:5`
   - Triggers: "post", "feed", "carousel", "Instagram post", "Facebook post"
   - Dimensions: 1080x1350
   - Platform compatibility: Instagram Feed, Facebook Feed, LinkedIn

3. **Explicit 1:1 Requests Only**: Use `1:1` ONLY when user explicitly requests
   - Triggers: "square", "1:1", "square format", "1:1 aspect ratio"
   - Dimensions: 1080x1080
   - Platform compatibility: Instagram Feed, Facebook, LinkedIn

4. **Landscape/YouTube/Twitter**: Use `16:9`
   - Triggers: "landscape", "YouTube", "Twitter", "landscape video", "horizontal"
   - Dimensions: 1920x1080
   - Platform compatibility: YouTube, Twitter, Facebook

### Decision Tree

```
User Request Analysis:
├── Contains "story" or "stories" → 9:16
├── Contains "post", "feed", or "carousel" → 4:5
├── Contains "square", "1:1", or explicit 1:1 request → 1:1
├── Contains "landscape", "YouTube", or "Twitter" → 16:9
└── No clear platform mention → Default to 4:5 (posts/carousel most common)
```

## Command Structure

### Available Commands

```bash
# List templates
meme-lyr list [--limit <n>]

# View template details
meme-lyr view <template-id>

# Generate simple meme
meme-lyr generate <template-id> --text0 <text> [--text1 <text>] [--output <path>]

# Generate meme with aspect ratio (social media optimized)
meme-lyr carousel <template-id> --text0 <text> --aspect-ratio <ratio> [--text1 <text>] [--background <color>] [--output <path>]

# Configure credentials
meme-lyr config --username <username> --password <password> [--default-background <color>]
```

## Template Selection

### Popular Templates (Good for General Use)

- **181913649**: Drake Hotline Bling (2 boxes) - Good for reactions, comparisons
- **112126428**: Distracted Boyfriend (3 boxes) - Good for attention vs. distraction
- **222403160**: Bernie Sanders (2 boxes) - Good for requests, support needed
- **101470**: Ancient Aliens (2 boxes) - Good for conspiracies, "aliens" content
- **61579**: One Does Not Simply (2 boxes) - Classic meme format
- **135256802**: Epic Handshake (3 boxes) - Good for agreements, partnerships
- **252758727**: Expanding Brain (4 boxes) - Good for progressions, levels of understanding

### Selecting Templates

1. **Match template to content theme**:
   - For reactions/comparisons: Drake Hotline Bling (181913649)
   - For distraction/attention: Distracted Boyfriend (112126428)
   - For requests/support: Bernie Sanders (222403160)
   - For progressions: Expanding Brain (252758727)

2. **Consider box count**:
   - 2 boxes: Simple before/after, cause/effect
   - 3 boxes: Three-step process, multiple actors
   - 4+ boxes: Progressions, multi-step processes

## Text Guidelines

### Text Length
- **Text0 (primary)**: Keep under 50 characters for best readability
- **Text1 (secondary)**: Keep under 40 characters
- **Total**: Both texts should fit comfortably without cramping

### Content Guidelines
- Make text relatable and shareable
- Use popular meme formats but with original content
- Avoid overly long or complex text
- Consider the visual space in the meme template

## Background Selection

### Default Behavior
- Default to white background unless user specifies otherwise
- Backgrounds can be set via `--background <color>` flag

### Available Colors
- white, black, gray, light-blue, dark-blue, light-green, dark-green
- light-red, dark-red, light-yellow, dark-yellow, purple, pink, orange, teal

### Color Selection Tips
- **Professional/serious**: white, gray, dark-blue, purple
- **Fun/engaging**: pink, orange, light-blue, light-green
- **Contrast**: dark backgrounds with light text, light backgrounds with dark text

## Workflow

### Step 1: Analyze User Request
- Extract the core message/content
- Identify the intended platform/use case
- Determine appropriate aspect ratio using the decision tree
- Select matching template based on content theme

### Step 2: Generate Command
```bash
meme-lyr carousel <template-id> --text0 "<primary text>" --aspect-ratio <ratio> [--text1 "<secondary text>"] [--output <output_path>]
```

### Step 3: Execute and Validate
- Run the command using shell execution
- Check for successful completion
- Verify the output file was created
- Report the result to the user with file location

### Step 4: Handle Errors
- If credentials not configured: guide user to run `meme-lyr config`
- If template not found: suggest popular alternatives
- If command fails: provide actionable error message
- If aspect ratio invalid: suggest valid options

## Error Handling

### Common Issues and Solutions

1. **Credentials not configured**
   - Error: "IMGFLIP_USERNAME and IMGFLIP_PASSWORD environment variables are required"
   - Solution: Run `meme-lyr config --username <user> --password <pass>`

2. **Invalid aspect ratio**
   - Error: "Invalid aspect ratio: X"
   - Solution: Use valid ratios: 1:1, 4:5, 9:16, 16:9, original

3. **Template not found**
   - Error: Template ID invalid
   - Solution: Run `meme-lyr list` to see available templates

4. **Sharp library errors**
   - Error: Image processing failures
   - Solution: Ensure Sharp dependencies are installed correctly

## Output Format

### Success Response
```
carousel_meme:
  url: <imgflip_url>
  saved_to: <file_path>
  aspect_ratio: <ratio>
  background: <color>
  template_id: <id>
  text0: <text>
  text1: <text> (if present)

help[1]:
  Carousel meme saved successfully to <file_path>
  Ready for posting to <platforms>
```

### Error Response
```
error: <error_message>
help: <actionable_suggestion>
```

## Integration Example

### User Request: "Create a meme for an Instagram story about productivity"

**Skill Processing:**
1. Detect "Instagram story" → Aspect ratio: 9:16
2. Theme: productivity → Template: Drake Hotline Bling (181913649)
3. Generate command:
   ```bash
   meme-lyr carousel 181913649 --text0 "Waking up early" --text1 "Being productive" --aspect-ratio 9:16 --output instagram_story.png
   ```
4. Execute and report results

### User Request: "Make a carousel post about work-life balance"

**Skill Processing:**
1. Detect "carousel post" → Aspect ratio: 4:5
2. Theme: work-life balance → Template: Distracted Boyfriend (112126428)
3. Generate command:
   ```bash
   meme-lyr carousel 112126428 --text0 "My work" --text1 "My family" --aspect-ratio 4:5 --output carousel_post.png
   ```
4. Execute and report results

### User Request: "Create a square meme about coding"

**Skill Processing:**
1. Detect "square" → Aspect ratio: 1:1 (explicit request)
2. Theme: coding → Template: One Does Not Simply (61579)
3. Generate command:
   ```bash
   meme-lyr carousel 61579 --text0 "One does not simply" --text1 "write bug-free code" --aspect-ratio 1:1 --output square_meme.png
   ```
4. Execute and report results

## Best Practices

1. **Always prioritize aspect ratio detection** from user intent
2. **Use popular templates** for better recognition and engagement
3. **Keep text concise** for readability on mobile devices
4. **Match colors to content mood** and platform aesthetics
5. **Test generated memes** before final delivery when possible
6. **Provide multiple variations** when appropriate for carousel content
7. **Consider accessibility** - high contrast, readable fonts
8. **Stay current with meme trends** but use timeless formats for longevity