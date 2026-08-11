#!/usr/bin/env node

import axios from "axios";
import sharp from "sharp";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync, realpathSync } from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

// Types
interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

interface Config {
  imgflip_username?: string;
  imgflip_password?: string;
  default_background?: string;
  default_aspect_ratio?: string;
}

// Config directory and file paths
const CONFIG_DIR = path.join(os.homedir(), '.meme-lyr');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Load configuration from config file
async function loadConfig(): Promise<Config> {
  try {
    if (existsSync(CONFIG_FILE)) {
      const configData = await readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(configData) as Config;
    }
    return {};
  } catch (error) {
    // If config file exists but is invalid, return empty config
    if (existsSync(CONFIG_FILE)) {
      console.error(`Warning: Invalid config file at ${CONFIG_FILE}, using defaults`);
    }
    return {};
  }
}

// Ensure config directory exists
async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

interface ImgFlipResponse {
  success: boolean;
  data: {
    memes?: MemeTemplate[];
    url?: string;
  };
  error_message?: string;
}

// Aspect ratio configurations for different platforms
type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'original';

interface AspectRatioConfig {
  name: string;
  width: number;
  height: number;
  platforms: string[];
}

export const ASPECT_RATIOS: Record<AspectRatio, AspectRatioConfig> = {
  '1:1': {
    name: 'Square',
    width: 1080,
    height: 1080,
    platforms: ['Instagram Feed', 'Facebook', 'LinkedIn']
  },
  '4:5': {
    name: 'Portrait',
    width: 1080,
    height: 1350,
    platforms: ['Instagram Feed', 'Facebook']
  },
  '9:16': {
    name: 'Story',
    width: 1080,
    height: 1920,
    platforms: ['Instagram Stories', 'Facebook Stories', 'TikTok']
  },
  '16:9': {
    name: 'Landscape',
    width: 1920,
    height: 1080,
    platforms: ['YouTube', 'Twitter', 'Facebook']
  },
  'original': {
    name: 'Original',
    width: 0, // Will use original dimensions
    height: 0,
    platforms: ['Any']
  }
};

interface BackgroundColor {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

interface BackgroundConfig {
  type: 'color';
  color: BackgroundColor;
}

export const BACKGROUND_COLORS: BackgroundColor[] = [
  { name: 'white', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: 'black', hex: '#000000', rgb: [0, 0, 0] },
  { name: 'gray', hex: '#808080', rgb: [128, 128, 128] },
  { name: 'light-blue', hex: '#E3F2FD', rgb: [227, 242, 253] },
  { name: 'dark-blue', hex: '#1565C0', rgb: [21, 101, 192] },
  { name: 'light-green', hex: '#E8F5E9', rgb: [232, 245, 233] },
  { name: 'dark-green', hex: '#2E7D32', rgb: [46, 125, 50] },
  { name: 'light-red', hex: '#FFEBEE', rgb: [255, 235, 238] },
  { name: 'dark-red', hex: '#C62828', rgb: [198, 40, 40] },
  { name: 'light-yellow', hex: '#FFFDE7', rgb: [255, 253, 231] },
  { name: 'dark-yellow', hex: '#F9A825', rgb: [249, 168, 37] },
  { name: 'purple', hex: '#7B1FA2', rgb: [123, 31, 162] },
  { name: 'pink', hex: '#C2185B', rgb: [194, 24, 91] },
  { name: 'orange', hex: '#EF6C00', rgb: [239, 108, 0] },
  { name: 'teal', hex: '#00897B', rgb: [0, 137, 123] }
];

// AXI-compliant CLI structure
const COMMANDS = {
  list: "List popular meme templates",
  view: "View details of a specific template",
  generate: "Generate a meme from a template",
  carousel: "Generate carousel memes with aspect ratios",
  "aspect-ratios": "List available aspect ratios",
  "background-options": "List available background colors",
  config: "Manage configuration settings",
  help: "Show help information"
} as const;

type Command = keyof typeof COMMANDS;

// Valid flags for each command (user-facing kebab-case)
const VALID_FLAGS: Record<Command, string[]> = {
  list: ["limit", "fields", "help"],
  view: ["help"],
  generate: ["text0", "text1", "output", "help"],
  carousel: ["text0", "text1", "aspect-ratio", "background", "output", "help"],
  "aspect-ratios": ["help"],
  "background-options": ["help"],
  config: ["username", "password", "default-background", "help"],
  help: []
};



// Utility functions
function getExecutablePath(): string {
  const execPath = process.argv[1];
  return execPath.replace(process.env.HOME || "", "~");
}

function outputTOON(data: string): void {
  console.log(data);
}

function outputError(message: string, help: string, exitCode: number = 2): void {
  outputTOON(`error: ${message}\nhelp: ${help}`);
  process.exit(exitCode);
}

export function truncateText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + `\n    ... (truncated, ${text.length} chars total)`;
}

// Image processing functions
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function processImageWithAspectRatio(
  imageUrl: string,
  aspectRatio: AspectRatio,
  backgroundConfig: BackgroundConfig,
  outputPath: string
): Promise<string> {
  try {
    // Download the original meme
    const imageBuffer = await downloadImage(imageUrl);
    const originalImage = sharp(imageBuffer);
    const metadata = await originalImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    // If original aspect ratio, just save the image
    if (aspectRatio === 'original') {
      await writeFile(outputPath, imageBuffer);
      return outputPath;
    }

    const targetConfig = ASPECT_RATIOS[aspectRatio];
    const targetWidth = targetConfig.width;
    const targetHeight = targetConfig.height;

    // Create the main image (contain fit - scaled to fit within target)
    const mainImage = originalImage.clone().resize(targetWidth, targetHeight, {
      fit: 'contain',
      position: 'center'
    });

    let finalImage: sharp.Sharp;

    // Use solid color background
    const bgColor = backgroundConfig.color || BACKGROUND_COLORS[0]; // default to white
    finalImage = originalImage.resize(targetWidth, targetHeight, {
      fit: 'contain',
      position: 'center',
      background: { r: bgColor.rgb[0], g: bgColor.rgb[1], b: bgColor.rgb[2] }
    });

    // Save the final image
    await finalImage.toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getBackgroundColor(colorName: string): BackgroundColor {
  const color = BACKGROUND_COLORS.find(c => c.name === colorName);
  if (!color) {
    throw new Error(`Invalid background color: ${colorName}. Available colors: ${BACKGROUND_COLORS.map(c => c.name).join(', ')}`);
  }
  return color;
}

export function parseBackgroundConfig(background: string, blur: string, blurIntensity: string): BackgroundConfig {
  // Blur backgrounds are currently disabled
  const colorName = background || 'white';
  const color = getBackgroundColor(colorName);
  return { type: 'color', color };
}

function ensureOutputDirectory(outputPath: string): void {
  const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
  if (dir && !existsSync(dir)) {
    mkdir(dir, { recursive: true });
  }
}

// API functions
async function getMemeTemplates(): Promise<MemeTemplate[]> {
  try {
    const response = await axios.get<ImgFlipResponse>("https://api.imgflip.com/get_memes");
    if (response.data.success && response.data.data.memes) {
      return response.data.data.memes;
    }
    throw new Error(response.data.error_message || "Failed to fetch meme templates");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw error;
  }
}

async function generateMeme(templateId: string, text0: string, text1?: string, config?: Config): Promise<string> {
  // Get credentials from config, environment variables, or throw error
  const username = config?.imgflip_username || process.env.IMGFLIP_USERNAME;
  const password = config?.imgflip_password || process.env.IMGFLIP_PASSWORD;

  if (!username || !password) {
    throw new Error("IMGFLIP_USERNAME and IMGFLIP_PASSWORD environment variables are required. Set them in ~/.meme-lyr/config.json or as environment variables.");
  }

  try {
    const formData = new FormData();
    formData.append("template_id", templateId);
    formData.append("text0", text0);
    if (text1) formData.append("text1", text1);
    formData.append("username", username);
    formData.append("password", password);

    const response = await axios.post<ImgFlipResponse>("https://api.imgflip.com/caption_image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success && response.data.data.url) {
      return response.data.data.url;
    }
    throw new Error(response.data.error_message || "Failed to generate meme");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw error;
  }
}

// Command implementations
async function cmdList(limit: number = 100, fields: string[] = ["id", "name", "box_count"]): Promise<void> {
  try {
    const templates = await getMemeTemplates();
    const total = templates.length;
    const displayTemplates = templates.slice(0, limit);

    if (displayTemplates.length === 0) {
      outputTOON("templates: 0 meme templates found");
      return;
    }

    // Build TOON header
    const header = `templates[${displayTemplates.length}]{${fields.join(",")}}:`;
    
    // Build TOON rows
    const rows = displayTemplates.map(template => {
      const values = fields.map(field => {
        const value = template[field as keyof MemeTemplate];
        return typeof value === "string" ? `"${value}"` : value;
      });
      return values.join(",");
    }).join("\n  ");

    outputTOON(`${header}\n  ${rows}`);
    outputTOON(`\ncount: ${displayTemplates.length} of ${total} total`);
    outputTOON(`\nhelp[2]:`);
    outputTOON(`  Run \`${getExecutablePath()} view <id>\` to see template details`);
    outputTOON(`  Run \`${getExecutablePath()} generate <id> --text0 "<text>" [--text1 "<text>"]\` to create a meme`);
  } catch (error) {
    outputError(
      error instanceof Error ? error.message : "Unknown error",
      "Check your internet connection and try again"
    );
  }
}

async function cmdView(templateId: string): Promise<void> {
  try {
    const templates = await getMemeTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      outputError(
        `Template ${templateId} not found`,
        `Run \`${getExecutablePath()}\` to list available templates`
      );
      return;
    }

    const details = [
      `id: ${template.id}`,
      `name: ${template.name}`,
      `url: ${template.url}`,
      `width: ${template.width}`,
      `height: ${template.height}`,
      `box_count: ${template.box_count}`
    ].join("\n");

    outputTOON(`template:\n  ${details}`);
    outputTOON(`\nhelp[1]:`);
    outputTOON(`  Run \`${getExecutablePath()} generate ${template.id} --text0 "<text>" [--text1 "<text>"]\` to create a meme`);
  } catch (error) {
    outputError(
      error instanceof Error ? error.message : "Unknown error",
      "Check your internet connection and try again"
    );
  }
}

async function cmdGenerate(templateId: string, text0: string, text1?: string, outputPath?: string, config?: Config): Promise<void> {
  try {
    const imageUrl = await generateMeme(templateId, text0, text1, config);
    
    if (outputPath) {
      ensureOutputDirectory(outputPath);
      const imageBuffer = await downloadImage(imageUrl);
      await writeFile(outputPath, imageBuffer);
      
      outputTOON(`meme:\n  url: ${imageUrl}`);
      outputTOON(`  saved_to: ${outputPath}`);
      outputTOON(`  template_id: ${templateId}`);
      outputTOON(`  text0: ${text0}`);
      if (text1) outputTOON(`  text1: ${text1}`);
      outputTOON(`\nhelp[1]:`);
      outputTOON(`  File saved successfully to ${outputPath}`);
    } else {
      outputTOON(`meme:\n  url: ${imageUrl}`);
      outputTOON(`  template_id: ${templateId}`);
      outputTOON(`  text0: ${text0}`);
      if (text1) outputTOON(`  text1: ${text1}`);
      outputTOON(`\nhelp[1]:`);
      outputTOON(`  Open the URL in a browser to view and download the meme`);
      outputTOON(`  Add --output <path> to save directly to a file`);
    }
  } catch (error) {
    outputError(
      error instanceof Error ? error.message : "Unknown error",
      "Ensure IMGFLIP_USERNAME and IMGFLIP_PASSWORD are set in ~/.meme-lyr/config.json or as environment variables"
    );
  }
}

async function cmdCarousel(
  templateId: string,
  text0: string,
  aspectRatio: AspectRatio,
  backgroundConfig: BackgroundConfig,
  text1?: string,
  outputPath?: string,
  config?: Config
): Promise<void> {
  try {
    const imageUrl = await generateMeme(templateId, text0, text1, config);
    
    if (!outputPath) {
      outputPath = `meme_${templateId}_${aspectRatio.replace(':', 'x')}_${backgroundConfig.color.name}.png`;
    }
    
    ensureOutputDirectory(outputPath);
    const processedPath = await processImageWithAspectRatio(imageUrl, aspectRatio, backgroundConfig, outputPath);
    
    let backgroundInfo: string;
    backgroundInfo = `${backgroundConfig.color.name} (${backgroundConfig.color.hex})`;
    
    outputTOON(`carousel_meme:\n  url: ${imageUrl}`);
    outputTOON(`  saved_to: ${processedPath}`);
    outputTOON(`  aspect_ratio: ${aspectRatio}`);
    outputTOON(`  background: ${backgroundInfo}`);
    outputTOON(`  template_id: ${templateId}`);
    outputTOON(`  text0: ${text0}`);
    if (text1) outputTOON(`  text1: ${text1}`);
    outputTOON(`\nhelp[1]:`);
    outputTOON(`  Carousel meme saved successfully to ${processedPath}`);
    outputTOON(`  Ready for posting to ${ASPECT_RATIOS[aspectRatio].platforms.join(', ')}`);
  } catch (error) {
    outputError(
      error instanceof Error ? error.message : "Unknown error",
      "Ensure IMGFLIP_USERNAME and IMGFLIP_PASSWORD are set in ~/.meme-lyr/config.json or as environment variables"
    );
  }
}

async function cmdAspectRatios(): Promise<void> {
  const ratioEntries = Object.entries(ASPECT_RATIOS);
  
  outputTOON(`aspect_ratios[${ratioEntries.length}]{ratio,name,dimensions,platforms}:`);
  ratioEntries.forEach(([ratio, config]) => {
    const dimensions = config.width > 0 ? `${config.width}x${config.height}` : 'original';
    const platforms = config.platforms.join(', ');
    outputTOON(`  "${ratio}","${config.name}","${dimensions}","${platforms}"`);
  });
  
  outputTOON(`\nhelp[2]:`);
  outputTOON(`  Run \`${getExecutablePath()} carousel <id> --aspect-ratio <ratio>\` to generate memes`);
  outputTOON(`  Run \`${getExecutablePath()} background-options\` to see available background options`);
}

async function cmdColors(): Promise<void> {
  outputTOON(`colors[${BACKGROUND_COLORS.length}]{name,hex}:`);
  BACKGROUND_COLORS.forEach(color => {
    outputTOON(`  "${color.name}","${color.hex}"`);
  });
  
  outputTOON(`\nhelp[1]:`);
  outputTOON(`  Run \`${getExecutablePath()} carousel <id> --background <color>\` to use a background color`);
}

async function cmdConfig(username?: string, password?: string, defaultBackground?: string): Promise<void> {
  await ensureConfigDir();
  const config = await loadConfig();
  
  // Update config with provided values
  if (username) config.imgflip_username = username;
  if (password) config.imgflip_password = password;
  if (defaultBackground) config.default_background = defaultBackground;
  
  // Save config
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  outputTOON(`config[1]{file}:`);
  outputTOON(`  "${CONFIG_FILE}"`);
  
  outputTOON(`\nconfig_values[${Object.keys(config).length}]{key,value}:`);
  if (config.imgflip_username) outputTOON(`  "imgflip_username","${config.imgflip_username}"`);
  if (config.imgflip_password) outputTOON(`  "imgflip_password","***"`);
  if (config.default_background) outputTOON(`  "default_background","${config.default_background}"`);
  
  outputTOON(`\nhelp[1]:`);
  outputTOON(`  Configuration saved successfully to ${CONFIG_FILE}`);
  outputTOON(`  You can now run meme-lyr commands without setting environment variables`);
}

function cmdHelp(command?: string): void {
  const executable = getExecutablePath();
  
  if (command === "list") {
    outputTOON(`USAGE: ${executable} list [--limit <n>] [--fields <field1,field2>]\n`);
    outputTOON(`FLAGS:`);
    outputTOON(`  --limit <n>     Maximum number of templates to show (default: 100)`);
    outputTOON(`  --fields <...>  Comma-separated fields to display (default: id,name,box_count)`);
    outputTOON(`                  Available fields: id, name, url, width, height, box_count\n`);
    outputTOON(`EXAMPLES:`);
    outputTOON(`  ${executable} list`);
    outputTOON(`  ${executable} list --limit 20`);
    outputTOON(`  ${executable} list --fields id,name,width,height`);
    process.exit(0);
  }

  if (command === "view") {
    outputTOON(`USAGE: ${executable} view <template-id>\n`);
    outputTOON(`ARGUMENTS:`);
    outputTOON(`  template-id    The ID of the meme template to view\n`);
    outputTOON(`EXAMPLES:`);
    outputTOON(`  ${executable} view 61579`);
    process.exit(0);
  }

  if (command === "generate") {
    outputTOON(`USAGE: ${executable} generate <template-id> --text0 <text> [--text1 <text>] [--output <path>]\n`);
    outputTOON(`ARGUMENTS:`);
    outputTOON(`  template-id    The ID of the meme template to use\n`);
    outputTOON(`FLAGS:`);
    outputTOON(`  --text0 <text>  Text for the first caption box (required)`);
    outputTOON(`  --text1 <text>  Text for the second caption box (optional)`);
    outputTOON(`  --output <path>  Save the meme to a file (optional)\n`);
    outputTOON(`ENVIRONMENT VARIABLES:`);
    outputTOON(`  IMGFLIP_USERNAME  Your ImgFlip username (required)`);
    outputTOON(`  IMGFLIP_PASSWORD  Your ImgFlip password (required)\n`);
    outputTOON(`EXAMPLES:`);
    outputTOON(`  ${executable} generate 61579 --text0 "One does not simply" --text1 "code without bugs"`);
    outputTOON(`  ${executable} generate 101470 --text0 "Aliens" --text1 "Be like" --output meme.png`);
    process.exit(0);
  }

  if (command === "carousel") {
    outputTOON(`USAGE: ${executable} carousel <template-id> --text0 <text> --aspect-ratio <ratio> [--text1 <text>] [--background <color>] [--output <path>]\n`);
    outputTOON(`ARGUMENTS:`);
    outputTOON(`  template-id    The ID of the meme template to use\n`);
    outputTOON(`FLAGS:`);
    outputTOON(`  --text0 <text>           Text for the first caption box (required)`);
    outputTOON(`  --text1 <text>           Text for the second caption box (optional)`);
    outputTOON(`  --aspect-ratio <ratio>   Target aspect ratio (required)`);
    outputTOON(`  --background <color>    Background color for padding (default: white)`);
    outputTOON(`  --output <path>         Save the meme to a file (optional)\n`);
    outputTOON(`ENVIRONMENT VARIABLES:`);
    outputTOON(`  IMGFLIP_USERNAME  Your ImgFlip username (required)`);
    outputTOON(`  IMGFLIP_PASSWORD  Your ImgFlip password (required)\n`);
    outputTOON(`ASPECT RATIOS:`);
    outputTOON(`  Run \`${executable} aspect-ratios\` to see available ratios\n`);
    outputTOON(`BACKGROUND COLORS:`);
    outputTOON(`  Run \`${executable} background-options\` to see available colors\n`);
    outputTOON(`EXAMPLES:`);
    outputTOON(`  ${executable} carousel 61579 --text0 "One does not simply" --text1 "code without bugs" --aspect-ratio "1:1"`);
    outputTOON(`  ${executable} carousel 101470 --text0 "Aliens" --aspect-ratio "9:16" --background light-blue`);
    process.exit(0);
  }

  if (command === "aspect-ratios") {
    outputTOON(`USAGE: ${executable} aspect-ratios\n`);
    outputTOON(`DESCRIPTION:`);
    outputTOON(`  Lists all available aspect ratios for carousel meme generation with platform compatibility\n`);
    process.exit(0);
  }

  if (command === "background-options") {
    outputTOON(`USAGE: ${executable} background-options\n`);
    outputTOON(`DESCRIPTION:`);
    outputTOON(`  Lists all available background colors for meme padding\n`);
    process.exit(0);
  }

  if (command === "config") {
    outputTOON(`USAGE: ${executable} config [--username <username>] [--password <password>] [--default-background <color>]\n`);
    outputTOON(`FLAGS:`);
    outputTOON(`  --username <username>           Set ImgFlip username`);
    outputTOON(`  --password <password>           Set ImgFlip password`);
    outputTOON(`  --default-background <color>   Set default background color\n`);
    outputTOON(`DESCRIPTION:`);
    outputTOON(`  Manage configuration settings stored in ~/.meme-lyr/config.json`);
    outputTOON(`  Credentials are stored locally and used for all CLI commands\n`);
    outputTOON(`EXAMPLES:`);
    outputTOON(`  ${executable} config --username myuser --password mypass`);
    outputTOON(`  ${executable} config --default-background pink`);
    outputTOON(`  ${executable} config --username myuser --password mypass --default-background light-blue\n`);
    process.exit(0);
  }

  // Default help
  outputTOON(`bin: ${executable}`);
  outputTOON(`description: Generate memes using ImgFlip API with aspect ratio support\n`);
  outputTOON(`USAGE: ${executable} [<command>] [args]\n`);
  outputTOON(`COMMANDS:`);
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    outputTOON(`  ${cmd.padEnd(15)} ${desc}`);
  });
  outputTOON(`\nRun \`${executable} <command> --help\` for command-specific help\n`);
  outputTOON(`DEFAULT BEHAVIOR:`);
  outputTOON(`  Running with no arguments lists popular meme templates`);
  process.exit(0);
}

// Argument parsing
// Exported for unit testing; on invalid flags it reports the error and exits.
export function parseArgs(args: string[]): { command: Command; params: Record<string, string> } {
  const params: Record<string, string> = {};
  let command: Command = "list"; // default command
  let helpTarget: string | undefined;
  const flags: Array<{flag: string, value: string}> = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith("--")) {
      const flag = arg.slice(2);
      let value = "true";
      
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        value = args[i + 1];
        i++;
      }
      
      flags.push({flag, value});
    } else if (Object.keys(COMMANDS).includes(arg)) {
      if (command === "help" && !helpTarget) {
        helpTarget = arg; // For `help view`, `help generate`, etc.
      } else {
        command = arg as Command;
      }
    } else if (!Object.keys(COMMANDS).includes(arg)) {
      // Positional argument (like template ID)
      if (!params.id) {
        params.id = arg;
      }
    }
  }

  // Validate flags against command's valid flags
  const validFlags = VALID_FLAGS[command];
  for (const {flag, value} of flags) {
    // Always allow --help flag regardless of command
    if (!validFlags.includes(flag) && flag !== "help") {
      outputError(
        `unknown flag --${flag} for \`${command}\``,
        `valid flags for \`${command}\`: ${validFlags.join(", ")} (--help always allowed)`
      );
    }
    
    // Convert kebab-case to camelCase for internal use
    const camelCaseFlag = flag.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    params[camelCaseFlag] = value;
  }

  // If help target was set, store it in params
  if (helpTarget) {
    params.helpTarget = helpTarget;
  }

  return { command, params };
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, params } = parseArgs(args);

  // Load configuration
  await ensureConfigDir();
  const config = await loadConfig();

  // Handle --help flag
  if (params.help === "true") {
    cmdHelp(command);
  }

  // Handle help command
  if (command === "help") {
    cmdHelp(params.helpTarget);
  }

  switch (command) {
    case "list":
      const limit = params.limit ? parseInt(params.limit) : 100;
      const fields = params.fields ? params.fields.split(",") : ["id", "name", "box_count"];
      await cmdList(limit, fields);
      break;
    
    case "view":
      if (!params.id) {
        outputError(
          "template-id is required for view command",
          `${getExecutablePath()} view <template-id>`
        );
      }
      await cmdView(params.id);
      break;
    
    case "generate":
      if (!params.id) {
        outputError(
          "template-id is required for generate command",
          `${getExecutablePath()} generate <template-id> --text0 <text> [--text1 <text>]`
        );
      }
      if (!params.text0) {
        outputError(
          "--text0 is required for generate command",
          `${getExecutablePath()} generate <template-id> --text0 <text> [--text1 <text>]`
        );
      }
      await cmdGenerate(params.id, params.text0, params.text1, params.output, config);
      break;
    
    case "carousel":
      if (!params.id) {
        outputError(
          "template-id is required for carousel command",
          `${getExecutablePath()} carousel <template-id> --text0 <text> --aspect-ratio <ratio>`
        );
      }
      if (!params.text0) {
        outputError(
          "--text0 is required for carousel command",
          `${getExecutablePath()} carousel <template-id> --text0 <text> --aspect-ratio <ratio>`
        );
      }
      if (!params.aspectRatio) {
        outputError(
          "--aspect-ratio is required for carousel command",
          `${getExecutablePath()} carousel <template-id> --text0 <text> --aspect-ratio <ratio>`
        );
      }
      
      // Validate aspect ratio
      const validRatios = Object.keys(ASPECT_RATIOS) as AspectRatio[];
      if (!validRatios.includes(params.aspectRatio as AspectRatio)) {
        outputError(
          `Invalid aspect ratio: ${params.aspectRatio}`,
          `Valid ratios: ${validRatios.join(', ')}`
        );
      }
      
      // Parse background configuration
      const backgroundConfig = parseBackgroundConfig(
        params.background || config.default_background || 'white',
        'false',
        'medium'
      );
      
      await cmdCarousel(
        params.id,
        params.text0,
        params.aspectRatio as AspectRatio,
        backgroundConfig,
        params.text1,
        params.output,
        config
      );
      break;
    
    case "aspect-ratios":
      await cmdAspectRatios();
      break;
    
    case "background-options":
      await cmdColors();
      break;
    
    case "config":
      await cmdConfig(params.username, params.password, params.defaultBackground);
      break;
    
    default:
      cmdHelp();
  }
}

// Run only when invoked directly as a CLI (never when imported by tests).
// realpathSync is required because the npm `bin` entry is a symlink: under a
// global/`node_modules/.bin` install, process.argv[1] is the *symlink* path
// while import.meta.url is the resolved real file URL — without realpath the
// guard silently disables the CLI.
const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (isMain) {
  main().catch(error => {
    outputError(
      error instanceof Error ? error.message : "Unknown error",
      "Run --help for usage information",
      1
    );
  });
}
