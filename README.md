# Meme CLI

<!-- T2I HERO SPEC — Subject: a meme generation CLI — a meme template library (top/bottom text panels) on the left, an MCP server stamping finished meme images on the right; comedy timing icons (clock, punchline). Composition: template shelf → stamp → meme wall. Palette: meme yellow #facc15 → dark slate → punchline pink #ec4899. Style: playful flat vector, sticker aesthetic, no text. 16:9. -->

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![LOC](https://img.shields.io/badge/LOC-1.1K-informational?style=flat-square)
[![CI](https://github.com/ishan-parihar/meme-lyr/actions/workflows/ci.yml/badge.svg)](https://github.com/ishan-parihar/meme-lyr/actions/workflows/ci.yml)
![MCP](https://img.shields.io/badge/MCP-Server-orange?logo=modelcontextprotocol)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
An AXI-compliant CLI tool for generating memes using the ImgFlip API with advanced aspect ratio support for social media platforms. This tool provides a token-efficient, agent-friendly interface for autonomous AI agents to generate memes from popular templates optimized for Instagram, TikTok, YouTube, and more.

## Features

- **AXI-Compliant**: Follows Agent eXperience Interface standards for optimal agent interaction
- **TOON Output**: Token-Oriented Object Notation for efficient data exchange
- **Content-First Design**: Default view shows live data (meme templates) rather than help text
- **Structured Errors**: Clear error messages with actionable suggestions
- **Contextual Help**: Built-in help system with command-specific guidance
- **Aspect Ratio Support**: Generate memes optimized for different social media platforms
- **Solid Color Backgrounds**: 15+ background colors for padding to desired aspect ratios
- **Carousel Generation**: Create multiple meme variations for Instagram carousels
- **Image Processing**: Built-in Sharp-powered image manipulation
- **Configuration Management**: Store credentials and preferences in `~/.meme-lyr/config.json`
- **AI Agent Skill**: Dedicated skill for autonomous meme generation with intelligent aspect ratio detection

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/ishan-parihar/meme-lyr/main/install.sh | bash
```

This will install the CLI globally on your system using npm and automatically install the AI agent skill to `~/.agents/skills/`.

> **Note**: The installation script requires the repository to be published on GitHub. For local development, use the manual install method below.

### NPM Install

```bash
npm install -g meme-lyr
```

After installation, manually install the AI agent skill:

```bash
cp -r skills/meme-lyr ~/.agents/skills/
```

Or use without installation:

```bash
npx -y meme-lyr
```

### Manual Install

1. Clone the repository:
```bash
git clone https://github.com/ishan-parihar/meme-lyr.git
cd meme-lyr
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Install globally:
```bash
npm install -g .
```

5. Install AI agent skill:
```bash
cp -r skills/meme-lyr ~/.agents/skills/
```

## Configuration

### Set Up Credentials

The CLI requires ImgFlip credentials to generate memes. You can configure them in two ways:

#### Option 1: Configuration File (Recommended)

Store credentials in `~/.meme-lyr/config.json`:

```bash
meme-lyr config --username your_username --password your_password
```

You can also set a default background color:

```bash
meme-lyr config --default-background pink
```

#### Option 2: Environment Variables

Set environment variables:

```bash
export IMGFLIP_USERNAME="your_username"
export IMGFLIP_PASSWORD="your_password"
```

### Config File Location

Configuration is stored in `~/.meme-lyr/config.json` with the following structure:

```json
{
  "imgflip_username": "your_username",
  "imgflip_password": "your_password",
  "default_background": "white"
}
```

An example configuration file is available in the repository as `config.example.json`.

### Get ImgFlip Credentials

1. Sign up at https://imgflip.com/signup
2. Use your username and password for the CLI
3. Credentials are stored locally and never transmitted to third parties

### Configuration Priority

The CLI uses credentials in the following priority order:
1. Command-line flags (not currently implemented for credentials)
2. Environment variables (`IMGFLIP_USERNAME`, `IMGFLIP_PASSWORD`)
3. Configuration file (`~/.meme-lyr/config.json`)

This allows you to override config settings with environment variables when needed.

## Usage

### Default Behavior (Content-First)

Running the CLI with no arguments lists popular meme templates:

```bash
meme-lyr
```

Output:
```
templates[100]{id,name,box_count}:
  "181913649","Drake Hotline Bling",2
  "87743020","Two Buttons",3
  "112126428","Distracted Boyfriend",3
  ...

count: 100 of 100 total

help[2]:
  Run `meme-lyr view <id>` to see template details
  Run `meme-lyr generate <id> --text0 "<text>" [--text1 "<text>"]` to create a meme
```

### Commands

#### `list` - List popular meme templates

```bash
meme-lyr list [--limit <n>] [--fields <field1,field2>]
```

**Flags:**
- `--limit <n>`: Maximum number of templates to show (default: 100)
- `--fields <...>`: Comma-separated fields to display (default: id,name,box_count)
  - Available fields: id, name, url, width, height, box_count

**Examples:**
```bash
meme-lyr list
meme-lyr list --limit 20
meme-lyr list --fields id,name,width,height
```

#### `view` - View details of a specific template

```bash
meme-lyr view <template-id>
```

**Examples:**
```bash
meme-lyr view 61579
```

#### `generate` - Generate a meme from a template

```bash
meme-lyr generate <template-id> --text0 <text> [--text1 <text>] [--output <path>]
```

**Flags:**
- `--text0 <text>`: Text for the first caption box (required)
- `--text1 <text>`: Text for the second caption box (optional)
- `--output <path>`: Save the meme to a file (optional)

**Examples:**
```bash
meme-lyr generate 61579 --text0 "One does not simply" --text1 "code without bugs"
meme-lyr generate 101470 --text0 "Aliens" --text1 "Be like" --output meme.png
```

#### `carousel` - Generate carousel memes with aspect ratios

```bash
meme-lyr carousel <template-id> --text0 <text> --aspect-ratio <ratio> [--text1 <text>] [--background <color>] [--output <path>]
```

**Flags:**
- `--text0 <text>`: Text for the first caption box (required)
- `--text1 <text>`: Text for the second caption box (optional)
- `--aspect-ratio <ratio>`: Target aspect ratio (required)
- `--background <color>`: Background color for padding (default: white)
- `--output <path>`: Save the meme to a file (optional)

**Aspect Ratios:**
- `1:1` - Square (1080x1080) - Instagram Feed, Facebook, LinkedIn
- `4:5` - Portrait (1080x1350) - Instagram Feed, Facebook
- `9:16` - Story (1080x1920) - Instagram Stories, Facebook Stories, TikTok
- `16:9` - Landscape (1920x1080) - YouTube, Twitter, Facebook
- `original` - Original dimensions - Any platform

**Background Colors:**
Available colors: white, black, gray, light-blue, dark-blue, light-green, dark-green, light-red, dark-red, light-yellow, dark-yellow, purple, pink, orange, teal

**Examples:**
```bash
meme-lyr carousel 61579 --text0 "One does not simply" --text1 "code without bugs" --aspect-ratio "1:1"
meme-lyr carousel 101470 --text0 "Aliens" --aspect-ratio "9:16" --background light-blue
meme-lyr carousel 112126428 --text0 "Code works" --text1 "First try" --aspect-ratio "4:5" --background pink --output instagram_carousel.png
```

#### `aspect-ratios` - List available aspect ratios

```bash
meme-lyr aspect-ratios
```

Lists all available aspect ratios with platform compatibility information.

#### `background-options` - List available background colors

```bash
meme-lyr background-options
```

Lists all available background colors for solid backgrounds.

#### `config` - Manage configuration settings

```bash
meme-lyr config [--username <username>] [--password <password>] [--default-background <color>]
```

**Flags:**
- `--username <username>`: Set ImgFlip username
- `--password <password>`: Set ImgFlip password
- `--default-background <color>`: Set default background color

**Examples:**
```bash
meme-lyr config --username myuser --password mypass
meme-lyr config --default-background pink
meme-lyr config --username myuser --password mypass --default-background light-blue
```

Configuration is stored in `~/.meme-lyr/config.json` and used for all CLI commands.

## AI Agent Skill

The meme-lyr CLI includes a dedicated AI agent skill for autonomous meme generation with intelligent aspect ratio detection. This skill enables AI agents to automatically select appropriate aspect ratios based on platform context:

- **Stories** → 9:16 (Instagram Stories, Facebook Stories, TikTok)
- **Posts/Carousel** → 4:5 (Instagram Feed, Facebook Feed, LinkedIn)
- **Square** → 1:1 (only on explicit request)
- **Landscape** → 16:9 (YouTube, Twitter)
- **Default** → 4:5 (when no platform specified)

### Skill Installation

The skill is automatically installed to `~/.agents/skills/meme-lyr/` when using the quick install script. For manual installation, copy the skill directory:

```bash
cp -r skills/meme-lyr ~/.agents/skills/
```

### Skill Features

- **Automatic aspect ratio detection** based on platform context
- **Template selection guidance** for different content themes
- **Platform-specific optimization** for social media
- **Intelligent command generation** for meme-lyr CLI
- **Error handling** with actionable suggestions

The skill loads on demand when AI agents recognize meme generation tasks, providing zero-overhead for non-meme conversations while delivering intelligent meme creation when needed.

#### `help` - Show help information

```bash
meme-lyr help [<command>]
```

**Examples:**
```bash
meme-lyr help
meme-lyr help carousel
meme-lyr help generate
meme-lyr help background-options
meme-lyr help config
```

## Sample Memes

The `samples/` directory contains example memes generated in all aspect ratios with solid color backgrounds:

**White Background Examples:**
- `test_white_1x1.png` - Square format (Instagram Feed) - White background
- `test_white_4x5.png` - Portrait format (Instagram Feed) - White background
- `test_white_9x16.png` - Story format (Instagram Stories, TikTok) - White background
- `test_white_16x9.png` - Landscape format (YouTube, Twitter) - White background
- `test_white_original.png` - Original dimensions - White background
- `test_white_distracted_1x1.png` - Different template, square format - White background

**Colored Background Examples:**
- `fixed_meme_1x1.png` - Square format (Instagram Feed) - White background
- `fixed_meme_4x5.png` - Portrait format (Instagram Feed) - Pink background
- `fixed_meme_9x16.png` - Story format (Instagram Stories, TikTok) - Light blue background
- `fixed_meme_16x9.png` - Landscape format (YouTube, Twitter) - Purple background
- `fixed_distracted_boyfriend_1x1.png` - Square format example - Teal background

## Performance

The meme-lyr CLI is optimized for efficient memory usage across all operations:

### Memory Usage (RSS)

- **List command**: 92 MB
- **View command**: 90 MB
- **Generate command**: 91 MB
- **Carousel command**: 96-98 MB (varies by aspect ratio)
- **Config command**: 73 MB

### Maximum RSS Load: 98 MB

The highest memory usage occurs during carousel operations with image processing (aspect ratio transformations), which is excellent performance for a Node.js application handling HTTP requests, image downloading, and Sharp library image processing operations.

### Performance Characteristics

- **Lightweight operations** (list, view, config): 73-92 MB
- **Medium operations** (generate): 91 MB
- **Heavy operations** (carousel with image processing): 96-98 MB

The CLI demonstrates efficient memory management with no significant memory leaks or excessive consumption, making it suitable for deployment on resource-constrained environments.

## AXI Compliance

This CLI follows AXI (Agent eXperience Interface) standards:

1. **Token-efficient output**: Uses TOON format for ~40% token savings over JSON
2. **Minimal default schemas**: Shows only essential fields by default (3-4 fields)
3. **Content truncation**: Large fields are truncated with size information
4. **Pre-computed aggregates**: Includes total counts in list output
5. **Definitive empty states**: Explicit messages when no results are found
6. **Structured errors**: Clear error messages with actionable suggestions on stdout
7. **Idempotent mutations**: No errors when desired state already exists
8. **No interactive prompts**: All operations completable with flags alone
9. **Fail loud on unrecognized input**: Unknown flags are rejected with clear error messages
10. **Content-first design**: Default view shows live data, not help text
11. **Contextual disclosure**: Help hints show relevant next steps

## Exit Codes

- `0`: Success (including no-ops)
- `1`: Error
- `2`: Usage error (missing required flags, unknown flags, etc.)

## Credits

Original project by [Vladimir Haltakov](https://haltakov.net). For inquiries, message on X [@haltakov](https://x.com/haltakov).

AXI compliance implementation, aspect ratio features, and AI agent skill integration by [Ishan Parihar](https://github.com/ishan-parihar).
## Example Output

### TOON Output (default)

```
meme_template:
  id: 181913649
  name: Distracted Boyfriend
  box_count: 2
  width: 1200
  height: 800

fetched_memes:
  - Distracted Boyfriend (2 boxes)
  - Drake Hotline Bling (2 boxes)
  - Two Buttons (2 boxes)
  - Change My Mind (1 box)
  - Expanding Brain (4 panels)

generated:
  template: Distracted Boyfriend
  top_text: "When the build passes"
  bottom_text: "But you didn't write tests"
  output: ./output/distracted_boyfriend_20260810.png
  size: 1200x800
  aspect_ratio: 1:1 (Instagram default)
  background: "#000000"
```

### JSON Output (--format json)

```json
{
  "template": "Distracted Boyfriend",
  "boxes": [
    {"text": "When the build passes", "color": "#ffffff", "outline": "#000000"},
    {"text": "But you didn't write tests", "color": "#ffffff", "outline": "#000000"}
  ],
  "output": "./output/distracted_boyfriend_20260810.png",
  "meta": {"aspect_ratio": "1:1", "background": "#000000"}
}
```

### Carousel Generation

```bash
# Generate 5 meme variations for an Instagram carousel
meme-lyr generate --template "Distracted Boyfriend" \
  --variations 5 \
  --aspect-ratio 1:1 \
  --output ./carousel/
```

---

---

## ☕ Support & Sponsorship

If you find this project useful, consider supporting ongoing development:

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ea4aaa?style=flat-square&logo=github)](https://github.com/sponsors/ishan-parihar)
[![Donate](https://img.shields.io/badge/Donate-Razorpay-3395FF?style=flat-square)](https://rzp.io/rzp/ishan-parihar)

Your support funds new features, releases, and infrastructure for the whole ecosystem.