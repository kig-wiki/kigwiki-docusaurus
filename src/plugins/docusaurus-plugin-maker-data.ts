import type { LoadContext, Plugin } from '@docusaurus/types';
import * as fs from 'fs';
import * as path from 'path';
import { getCurrencyConverter } from '../utils/currency-converter';

// Custom error types
class FileLoadError extends Error {
  constructor(message: string, public readonly filePath: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'FileLoadError';
  }
}

class DataTransformationError extends Error {
  constructor(message: string, public readonly itemName: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DataTransformationError';
  }
}

class FileWriteError extends Error {
  constructor(message: string, public readonly filePath: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'FileWriteError';
  }
}

// Type definitions based on migration.md
export interface SocialLinks {
  x?: string;
  instagram?: string;
  facebook?: string;
  weibo?: string;
  bluesky?: string;
  tiktok?: string;
}

export interface PriceDetails {
  generic?: string;
  semiCustom?: string;
  fullCustom?: string;
}

export interface Features {
  budget?: boolean;
  "Hard Hair"?: boolean;
  shell?: boolean;
}

export interface HairOptions {
  "Hard Hair"?: boolean;
  "Hard HairPrice"?: string;
}

export interface Maker {
  name: string;
  alias?: string;
  website?: string;
  status?: 'open' | 'closed' | 'beware';
  region?: string;
  socials?: SocialLinks;
  priceRange?: string;
  priceDetails?: PriceDetails;
  approxStartingPrice?: string;
  currency?: string;
  priceTier?: string;
  type?: string;
  size?: string;
  materialType?: string;
  englishOrdering?: boolean | string;
  features?: Features;
  hairOptions?: HairOptions;
  notes?: string;
}

export interface PriceExample {
  type: string;
  price: string | number;
  link?: string;
}

export interface Hadatai {
  name: string;
  region?: string;
  currency?: string;
  socials?: SocialLinks;
  priceExamples?: PriceExample[];
  notes?: string;
  englishOrdering?: boolean | string;
}

export interface MakerDataContent {
  makers: Maker[];
  hadatai: Hadatai[];
}

interface PluginOptions {
  makersDir?: string;
  hadataiDir?: string;
  verbose?: boolean;
}

const makerDataPlugin = (context: LoadContext, options: PluginOptions = {}): Plugin<MakerDataContent> => {
  const { siteDir } = context;
  const { 
    makersDir = 'makers', 
    hadataiDir = 'hadatai',
    verbose = false 
  } = options;

  const log = (message: string, ...args: any[]) => {
    if (verbose) {
      console.log(`[maker-data-plugin] ${message}`, ...args);
    }
  };

  // Helper function to check if directory exists
  const directoryExists = (dirPath: string): boolean => {
    return fs.existsSync(dirPath);
  };

  // Helper function to get JSON files from directory
  const getJsonFiles = (dirPath: string): string[] => {
    try {
      const files = fs.readdirSync(dirPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      log(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  };

  // Helper function to load a single JSON file
  const loadSingleJsonFile = (filePath: string, fileName: string): any | null => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      log(`Loaded ${fileName}:`, parsed.name || 'unnamed');
      return parsed;
    } catch (error) {
      log(`Error loading ${fileName}:`, error);
      return null;
    }
  };

  const loadJsonFiles = async (dirPath: string): Promise<any[]> => {
    const fullPath = path.join(siteDir, dirPath);
    
    // Early return if directory doesn't exist
    if (!directoryExists(fullPath)) {
      log(`Directory ${fullPath} does not exist`);
      return [];
    }

    const jsonFiles = getJsonFiles(fullPath);
    log(`Found ${jsonFiles.length} JSON files in ${dirPath}`);
    
    const data = jsonFiles
      .map(file => {
        const filePath = path.join(fullPath, file);
        return loadSingleJsonFile(filePath, file);
      })
      .filter(Boolean);

    return data;
  };

  // Helper function to safely get region from item
  const getRegion = (item: any): string | undefined => {
    return item.Region || item.region;
  };

  // Helper function to safely get socials
  const getSocials = (item: any): SocialLinks => {
    return item.socials || {};
  };

  // Helper function to safely get features
  const getFeatures = (item: any): Features => {
    return item.features || {};
  };

  // Helper function to safely get hair options
  const getHairOptions = (item: any): HairOptions => {
    return item.hairOptions || {};
  };

  // Helper function to transform a single maker item
  const transformSingleMaker = (item: any): Maker => {
    try {
      return {
        name: item.name || 'Unknown',
        alias: item.alias,
        website: item.website,
        status: item.status,
        region: getRegion(item),
        socials: getSocials(item),
        priceRange: item.priceRange,
        priceDetails: item.priceDetails,
        approxStartingPrice: item.approxStartingPrice,
        currency: item.currency,
        priceTier: item.priceTier,
        type: item.type,
        size: item.size,
        materialType: item.materialType,
        englishOrdering: item.englishOrdering,
        features: getFeatures(item),
        hairOptions: getHairOptions(item),
        notes: item.notes,
      };
    } catch (error) {
      log(`Error transforming maker ${item.name || 'unknown'}:`, error);
      throw new DataTransformationError(
        `Failed to transform maker data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        item.name || 'unknown',
        error instanceof Error ? error : undefined
      );
    }
  };

  const transformMakerData = (rawData: any[], converter: any): Maker[] => {
    return rawData.map(transformSingleMaker);
  };

  // Helper function to convert price examples
  const convertPriceExamples = (priceExamples: any[], currency: string, itemName: string, converter: any): any[] => {
    return priceExamples.map((example: any) => {
      try {
        const converted = converter.convertPriceString(example.price.toString(), currency);
        return {
          ...example,
          price: `${converted.convertedFormatted} USD (${converted.original} ${converted.originalCurrency})`
        };
      } catch (error) {
        log(`Failed to convert price for ${itemName}:`, error);
        return example;
      }
    });
  };

  // Helper function to get price examples with conversion
  const getPriceExamples = (item: any, converter: any): any[] => {
    const priceExamples = item.priceExamples || [];
    
    // Early return if no currency or no price examples
    if (!item.currency || priceExamples.length === 0) {
      return priceExamples;
    }

    return convertPriceExamples(priceExamples, item.currency, item.name || 'unknown', converter);
  };

  // Helper function to determine English ordering support for hadatai
  const getEnglishOrderingSupport = (item: any): boolean | string => {
    // Check if there's an explicit englishOrdering field
    if (item.englishOrdering !== undefined) {
      return item.englishOrdering;
    }
    
    // Check notes for indicators of English ordering support
    const notes = item.notes?.toLowerCase() || '';
    const hasWebsiteOrdering = notes.includes('website') || notes.includes('ordered via their own website');
    const hasEnglishSupport = notes.includes('english') || notes.includes('international');
    
    // Check currency - USD often indicates English ordering support
    const hasUSDCurrency = item.currency === 'USD';
    
    // Check if notes mention Taobao agent requirement (indicates no direct English support)
    const requiresTaobaoAgent = notes.includes('taobao') && notes.includes('agent');
    
    if (requiresTaobaoAgent) {
      return false;
    }
    
    if (hasWebsiteOrdering || hasEnglishSupport || hasUSDCurrency) {
      return true;
    }
    
    // Default to false if no clear indicators
    return false;
  };

  // Helper function to transform a single hadatai item
  const transformSingleHadatai = (item: any, converter: any): Hadatai => {
    try {
      return {
        name: item.name || 'Unknown',
        region: getRegion(item),
        currency: item.currency,
        socials: getSocials(item),
        priceExamples: getPriceExamples(item, converter),
        notes: item.notes,
        englishOrdering: getEnglishOrderingSupport(item),
      };
    } catch (error) {
      log(`Error transforming hadatai ${item.name || 'unknown'}:`, error);
      throw new DataTransformationError(
        `Failed to transform hadatai data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        item.name || 'unknown',
        error instanceof Error ? error : undefined
      );
    }
  };

  const transformHadataiData = (rawData: any[], converter: any): Hadatai[] => {
    return rawData.map(item => transformSingleHadatai(item, converter));
  };

  // Helper function to ensure directory exists
  const ensureDirectoryExists = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  // Helper function to write TypeScript file
  const writeTypeScriptFile = (filePath: string, content: string): void => {
    try {
      fs.writeFileSync(filePath, content);
      log(`Created TypeScript file: ${filePath}`);
    } catch (error) {
      throw new FileWriteError(
        `Failed to write TypeScript file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  };

  // Helper function to create TypeScript content
  const createTypeScriptContent = (data: any[], typeName: string, exportName: string): string => {
    return `// Auto-generated file - do not edit manually
import type { ${typeName} } from '../plugins/docusaurus-plugin-maker-data';

export const ${exportName}: ${typeName}[] = ${JSON.stringify(data, null, 2)};
`;
  };

  // Helper function to create JSON data files
  const createJsonDataFiles = async (actions: any, content: MakerDataContent): Promise<void> => {
    const { createData } = actions;
    
    await createData(
      'makers-data.json',
      JSON.stringify(content.makers, null, 2)
    );

    await createData(
      'hadatai-data.json', 
      JSON.stringify(content.hadatai, null, 2)
    );
  };

  // Helper function to create TypeScript data files
  const createTypeScriptDataFiles = (content: MakerDataContent): void => {
    const dataDir = path.join(siteDir, 'src', 'data');
    ensureDirectoryExists(dataDir);

    const makersTsPath = path.join(dataDir, 'makers-data.ts');
    const hadataiTsPath = path.join(dataDir, 'hadatai-data.ts');

    const makersTsContent = createTypeScriptContent(content.makers, 'Maker', 'makersData');
    const hadataiTsContent = createTypeScriptContent(content.hadatai, 'Hadatai', 'hadataiData');

    writeTypeScriptFile(makersTsPath, makersTsContent);
    writeTypeScriptFile(hadataiTsPath, hadataiTsContent);
  };

  return {
    name: 'docusaurus-plugin-maker-data',

    async loadContent(): Promise<MakerDataContent> {
      log('Loading maker and hadatai data...');
      
      // Initialize currency converter
      const converter = getCurrencyConverter();
      await converter.loadRates();
      
      const [rawMakers, rawHadatai] = await Promise.all([
        loadJsonFiles(makersDir),
        loadJsonFiles(hadataiDir),
      ]);

      const makers = transformMakerData(rawMakers, converter);
      const hadatai = transformHadataiData(rawHadatai, converter);

      log(`Loaded ${makers.length} makers and ${hadatai.length} hadatai entries`);

      return {
        makers,
        hadatai,
      };
    },

    async contentLoaded({ content, actions }) {
      log('Creating data files for static import...');
      
      try {
        await createJsonDataFiles(actions, content);
        createTypeScriptDataFiles(content);
        log('Data files created successfully');
      } catch (error) {
        log('Error creating data files:', error);
        throw error;
      }
    },


    getPathsToWatch() {
      return [
        path.join(siteDir, makersDir, '**/*.json'),
        path.join(siteDir, hadataiDir, '**/*.json'),
      ];
    },


  };
};

export default makerDataPlugin;
