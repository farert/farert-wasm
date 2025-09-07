/**
 * Comprehensive Error Handling Utilities
 * Task 18: Enhanced Error Handling for Route Construction and Fare Calculation
 * 
 * This module provides comprehensive error handling utilities for the Farert CLI,
 * including enhanced error classes, fuzzy matching for invalid station names,
 * error code classification, and user-friendly Japanese error messages.
 * 
 * Requirements:
 * - REQ-OBJ-002: Enhanced object class functionality with detailed error information
 * - REQ-CLI-003.1: WebAssembly module loading error handling
 * - REQ-CLI-003.2: Database initialization error handling  
 * - REQ-CLI-003.3: Input validation with fuzzy matching suggestions
 * - REQ-CLI-003.4: JavaScript exception handling with localized messages
 * 
 * Features:
 * - RouteConstructionError and RouteCalculationError classes extending CLIError
 * - Fuzzy matching for invalid station and line names (up to 3 suggestions)
 * - Error code classification system with comprehensive coverage
 * - Japanese and English error messages for user interface display
 * - Integration with existing RouteUtility methods for suggestion generation
 * 
 * @since Task 18 (Enhanced Error Handling Utilities)
 */

import { 
    CLIError, 
    CLIErrorCode, 
    RouteErrorCode,
    ValidationResult,
    RouteConstructionError as BaseRouteConstructionError,
    FareCalculationError as BaseFareCalculationError,
    FarertModule
} from './types';

// ===============================
// Enhanced Error Classes
// ===============================

/**
 * Enhanced RouteConstructionError with fuzzy matching suggestions
 * 
 * Extends the base RouteConstructionError with advanced fuzzy matching
 * capabilities for station and line names, providing actionable suggestions
 * to users when route construction fails due to invalid inputs.
 * 
 * @class RouteConstructionError
 * @extends BaseRouteConstructionError
 */
export class RouteConstructionError extends BaseRouteConstructionError {
    public readonly stationSuggestions: string[];
    public readonly lineSuggestions: string[];
    
    constructor(
        message: string,
        routeErrorCode: RouteErrorCode,
        options: {
            invalidStations?: string[];
            invalidLines?: string[];
            routeSegment?: number;
            validationResult?: ValidationResult;
            context?: Record<string, any>;
            module?: FarertModule; // For dynamic suggestion generation
        } = {}
    ) {
        super(message, routeErrorCode, options);
        
        // Generate fuzzy matching suggestions for invalid stations
        this.stationSuggestions = this.generateStationSuggestions(
            options.invalidStations || [],
            options.module
        );
        
        // Generate fuzzy matching suggestions for invalid lines
        this.lineSuggestions = this.generateLineSuggestions(
            options.invalidLines || [],
            options.module
        );
        
        // Enhance suggestions with fuzzy matching results
        this.suggestions.push(...this.generateEnhancedSuggestions());
    }
    
    /**
     * Generate fuzzy matching suggestions for invalid station names
     */
    private generateStationSuggestions(invalidStations: string[], module?: FarertModule): string[] {
        const allSuggestions: string[] = [];
        
        for (const invalidStation of invalidStations) {
            const suggestions = getFuzzyStationMatches(invalidStation, module);
            allSuggestions.push(...suggestions.slice(0, 3)); // Limit to 3 per station
        }
        
        // Remove duplicates and limit total suggestions
        return Array.from(new Set(allSuggestions)).slice(0, 9);
    }
    
    /**
     * Generate fuzzy matching suggestions for invalid line names
     */
    private generateLineSuggestions(invalidLines: string[], module?: FarertModule): string[] {
        const allSuggestions: string[] = [];
        
        for (const invalidLine of invalidLines) {
            const suggestions = getFuzzyLineMatches(invalidLine, module);
            allSuggestions.push(...suggestions.slice(0, 3)); // Limit to 3 per line
        }
        
        // Remove duplicates and limit total suggestions
        return Array.from(new Set(allSuggestions)).slice(0, 9);
    }
    
    /**
     * Generate enhanced suggestions based on error context
     */
    private generateEnhancedSuggestions(): string[] {
        const suggestions: string[] = [];
        
        if (this.stationSuggestions.length > 0) {
            suggestions.push(`駅名候補: ${this.stationSuggestions.join('、')}`);
        }
        
        if (this.lineSuggestions.length > 0) {
            suggestions.push(`路線名候補: ${this.lineSuggestions.join('、')}`);
        }
        
        // Add context-specific suggestions
        if (this.routeSegment !== undefined) {
            suggestions.push(`ルート区間 ${this.routeSegment + 1} を確認してください`);
        }
        
        return suggestions;
    }
    
    /**
     * Get comprehensive error report with fuzzy matching suggestions
     */
    getEnhancedErrorReport(): string {
        let report = this.getFormattedMessage('ja');
        
        if (this.stationSuggestions.length > 0) {
            report += '\n🚉 駅名候補:\n';
            this.stationSuggestions.forEach((suggestion, index) => {
                report += `  ${index + 1}. ${suggestion}\n`;
            });
        }
        
        if (this.lineSuggestions.length > 0) {
            report += '\n🚃 路線名候補:\n';
            this.lineSuggestions.forEach((suggestion, index) => {
                report += `  ${index + 1}. ${suggestion}\n`;
            });
        }
        
        return report;
    }
}

/**
 * Enhanced FareCalculationError with detailed calculation context
 * 
 * Extends the base FareCalculationError with additional context about
 * fare calculation failures, including rule conflicts, calculation steps,
 * and debugging information for complex fare calculation scenarios.
 * 
 * @class FareCalculationError
 * @extends BaseFareCalculationError
 */
export class FareCalculationError extends BaseFareCalculationError {
    public readonly debugSteps: string[];
    public readonly ruleConflicts: string[];
    
    constructor(
        message: string,
        routeErrorCode: RouteErrorCode,
        options: {
            calculationContext?: BaseFareCalculationError['calculationContext'];
            fareDetails?: BaseFareCalculationError['fareDetails'];
            debugSteps?: string[];
            ruleConflicts?: string[];
            context?: Record<string, any>;
        } = {}
    ) {
        super(message, routeErrorCode, options);
        
        this.debugSteps = options.debugSteps || [];
        this.ruleConflicts = options.ruleConflicts || [];
        
        // Add enhanced suggestions for fare calculation issues
        this.suggestions.push(...this.generateFareCalculationSuggestions());
    }
    
    /**
     * Generate specific suggestions for fare calculation issues
     */
    private generateFareCalculationSuggestions(): string[] {
        const suggestions: string[] = [];
        
        if (this.ruleConflicts.length > 0) {
            suggestions.push('特別ルールの競合が検出されました:');
            this.ruleConflicts.forEach(conflict => {
                suggestions.push(`  - ${conflict}`);
            });
        }
        
        if (this.calculationContext?.companyCount && this.calculationContext.companyCount > 3) {
            suggestions.push('複数の鉄道会社を経由するルートです。直通ルートを検討してください。');
        }
        
        if (this.calculationContext?.routeDistance && this.calculationContext.routeDistance > 600) {
            suggestions.push('長距離ルートです。乗り継ぎ割引が適用される可能性があります。');
        }
        
        return suggestions;
    }
    
    /**
     * Get enhanced fare calculation error report
     */
    getEnhancedCalculationReport(): string {
        let report = this.getFareCalculationDebugInfo();
        
        if (this.debugSteps.length > 0) {
            report += '\n🔍 計算ステップ:\n';
            this.debugSteps.forEach((step, index) => {
                report += `  ${index + 1}. ${step}\n`;
            });
        }
        
        if (this.ruleConflicts.length > 0) {
            report += '\n⚠️  ルール競合:\n';
            this.ruleConflicts.forEach((conflict, index) => {
                report += `  ${index + 1}. ${conflict}\n`;
            });
        }
        
        return report;
    }
}

// ===============================
// Fuzzy Matching Utilities
// ===============================

/**
 * Get fuzzy matching suggestions for invalid station names
 * Leverages existing station data and implements advanced matching algorithms
 * 
 * @param invalidName The invalid station name
 * @param module Optional WebAssembly module for dynamic station lookup
 * @returns Array of up to 3 suggested station names
 */
export function getFuzzyStationMatches(invalidName: string, module?: FarertModule): string[] {
    // Common stations database (comprehensive list)
    const commonStations = [
        // Major cities
        '東京', '新宿', '渋谷', '池袋', '品川', '上野', '秋葉原', '有楽町', '新橋',
        '田町', '浜松町', '大崎', '五反田', '目黒', '恵比寿', '原宿', '代々木',
        
        // Osaka area
        '大阪', '梅田', '難波', '天王寺', '新大阪', '京橋', '淀屋橋', '本町',
        '心斎橋', 'なんば', '天満橋', '大阪港', '弁天町', '西九条',
        
        // Other major cities
        '京都', '名古屋', '横浜', '神戸', '福岡', '仙台', '札幌', '広島',
        '静岡', '浜松', '岡山', '金沢', '新潟', '長野', '松本', '甲府',
        
        // Kanto region
        '大宮', 'さいたま新都心', '浦和', '川口', '赤羽', '北千住', '上野',
        '日暮里', '西日暮里', '田端', '駒込', '巣鴨', '大塚', '護国寺',
        '茗荷谷', '後楽園', '飯田橋', '四ツ谷', '市ヶ谷', '麹町', '永田町',
        
        // Chiba
        '千葉', '船橋', '柏', '松戸', '市川', '津田沼', '稲毛', '幕張',
        '海浜幕張', '蘇我', '木更津', '君津', '館山', '銚子',
        
        // Kanagawa
        '川崎', '横浜', '戸塚', '大船', '藤沢', '平塚', '小田原', '厚木',
        '相模原', '橋本', '八王子', '立川', '国分寺', '三鷹', '吉祥寺',
        
        // Suburban Tokyo
        '中野', '高円寺', '阿佐ヶ谷', '荻窪', '西荻窪', '武蔵境', '東小金井',
        '武蔵小金井', '国立', '立川', '日野', '豊田', '八王子', '高尾',
        
        // Tokyo eastern suburbs  
        '北千住', '綾瀬', '亀有', '金町', '松戸', '新松戸', '馬橋', '北小金',
        '南柏', '柏', '我孫子', '取手', '藤代', '竜ヶ崎', '佐貫', '牛久',
        
        // Tokaido line
        '川崎', '鶴見', '新子安', '東神奈川', '横浜', '保土ヶ谷', '東戸塚',
        '戸塚', '大船', '藤沢', '辻堂', '茅ヶ崎', '平塚', '大磯', '二宮',
        '国府津', '鴨宮', '小田原', '早川', '根府川', '真鶴', '湯河原',
        '熱海', '来宮', '伊東', '網代', '伊豆多賀', '伊豆山', '函南',
        '三島', '沼津', '片浜', '原', '東田子の浦', '吉原', '富士',
        '富士川', '新蒲原', '蒲原', '由比', '興津', '清水', '草薙',
        '東静岡', '静岡', '安倍川', '用宗', '焼津', '西焼津', '藤枝',
        '六合', '島田', '金谷', '菊川', '掛川', '愛野', '袋井', '御厨',
        '豊田町', '磐田', '竜洋', '岩田', '天竜川', '浜松', '高塚', '舞阪',
        '弁天島', '新居町', '鷲津', '新所原', '二川', '豊橋', '西小坂井',
        '愛知御津', '三河大塚', '蒲郡', '三河塩津', '三根', '幸田', '相見',
        '岡崎', '西岡崎', '安城', '三河安城', '東刈谷', '野田新町', '刈谷',
        '逢妻', '大府', '共和', '南大高', '大高', '笠寺', '熱田', '金山',
        '尾頭橋', '名古屋'
    ];
    
    const suggestions: string[] = [];
    const cleanInput = normalizeJapaneseText(invalidName);
    
    // Phase 1: Direct substring matching with normalized text
    for (const station of commonStations) {
        const normalizedStation = normalizeJapaneseText(station);
        
        if (normalizedStation.includes(cleanInput) || 
            cleanInput.includes(normalizedStation) ||
            station.includes(invalidName) || 
            invalidName.includes(station)) {
            
            if (!suggestions.includes(station)) {
                suggestions.push(station);
                if (suggestions.length >= 3) break;
            }
        }
    }
    
    // Phase 2: Character similarity matching if not enough found
    if (suggestions.length < 3) {
        const candidates = commonStations
            .filter(station => !suggestions.includes(station))
            .map(station => ({
                name: station,
                similarity: calculateJapaneseSimilarity(invalidName, station)
            }))
            .filter(candidate => candidate.similarity > 0.25)
            .sort((a, b) => b.similarity - a.similarity);
        
        for (const candidate of candidates) {
            suggestions.push(candidate.name);
            if (suggestions.length >= 3) break;
        }
    }
    
    // Phase 3: Dynamic lookup using WebAssembly module if available
    if (suggestions.length < 3 && module && typeof module.getStationId === 'function') {
        // Try variations of the input
        const variations = generateStationNameVariations(invalidName);
        
        for (const variation of variations) {
            try {
                const stationId = module.getStationId(variation);
                if (stationId > 0 && typeof module.getStationName === 'function') {
                    const stationName = module.getStationName(stationId);
                    if (stationName && stationName !== 'null' && !suggestions.includes(stationName)) {
                        suggestions.push(stationName);
                        if (suggestions.length >= 3) break;
                    }
                }
            } catch (e) {
                // Silently ignore lookup failures
            }
        }
    }
    
    return suggestions.slice(0, 3);
}

/**
 * Get fuzzy matching suggestions for invalid line names
 * Leverages existing line data and implements advanced matching algorithms
 * 
 * @param invalidName The invalid line name
 * @param module Optional WebAssembly module for dynamic line lookup
 * @returns Array of up to 3 suggested line names
 */
export function getFuzzyLineMatches(invalidName: string, module?: FarertModule): string[] {
    // Common lines database (comprehensive list)
    const commonLines = [
        // JR East major lines
        '東海道線', '山手線', '京浜東北線', '中央線', '総武線', '常磐線',
        '東北線', '高崎線', '宇都宮線', '上野東京ライン', '湘南新宿ライン',
        '埼京線', '武蔵野線', '京葉線', '南武線', '鶴見線', '横浜線',
        '根岸線', '伊東線', '御殿場線', '身延線', '中央本線', '青梅線',
        '五日市線', '八高線', '川越線', '外房線', '内房線', '成田線',
        '総武本線', '東金線', '久留里線', '木原線', '鹿島線',
        
        // JR East Shinkansen
        '東北新幹線', '上越新幹線', '北陸新幹線', '山形新幹線', '秋田新幹線',
        
        // JR Central
        '東海道新幹線', '中央西線', '飯田線', '武豊線', '城北線', '関西本線',
        '紀勢本線', '参宮線', '名松線', '高山本線', '太多線', '中央本線',
        
        // JR West
        '山陽新幹線', '東海道本線', '山陽本線', '関西本線', '草津線', 
        '奈良線', '学研都市線', '東西線', 'JR難波線', '阪和線',
        '関西空港線', '大和路線', 'おおさか東線', '桜島線', 'JRゆめ咲線',
        '宝塚線', '福知山線', '加古川線', '播但線', '姫新線', '因美線',
        '津山線', '吉備線', '赤穂線', '山陰本線', '舞鶴線', '小浜線',
        '越美北線', '城端線', '氷見線', '七尾線', '大糸線',
        
        // JR Kyushu
        '鹿児島本線', '長崎本線', '佐世保線', '大村線', '筑肥線',
        '唐津線', '筑豊本線', '後藤寺線', '田川線', '香椎線', '篠栗線',
        '福北ゆたか線', '久大本線', '豊肥本線', '肥薩線', '吉都線',
        '日南線', '指宿枕崎線', '日豊本線', '宮崎空港線', '九州新幹線',
        
        // Private railways (major)
        '東急東横線', '東急田園都市線', '東急目黒線', '東急池上線',
        '東急大井町線', '東急世田谷線', '東急多摩川線', '東急こどもの国線',
        
        '小田急小田原線', '小田急江ノ島線', '小田急多摩線',
        
        '京王線', '京王井の頭線', '京王新線', '京王高尾線',
        '京王相模原線', '京王競馬場線', '京王動物園線',
        
        '西武池袋線', '西武新宿線', '西武有楽町線', '西武豊島線',
        '西武秩父線', '西武拝島線', '西武多摩湖線', '西武国分寺線',
        '西武西武園線', '西武多摩川線', '西武山口線',
        
        '東武伊勢崎線', '東武日光線', '東武野田線', '東武東上線',
        '東武越生線', '東武佐野線', '東武小泉線', '東武桐生線',
        '東武宇都宮線', '東武鬼怒川線', '東武会津線',
        
        '京成本線', '京成押上線', '京成金町線', '京成千葉線',
        '京成千原線', '成田スカイアクセス',
        
        '相鉄本線', '相鉄いずみ野線', '相鉄新横浜線',
        
        // Tokyo Metro
        '銀座線', '丸ノ内線', '日比谷線', '東西線', '千代田線',
        '有楽町線', '半蔵門線', '南北線', '副都心線',
        
        // Toei
        '浅草線', '三田線', '新宿線', '大江戸線',
        
        // Kansai private railways
        '阪急神戸線', '阪急宝塚線', '阪急京都線', '阪急嵐山線',
        '阪神本線', '阪神なんば線', '近鉄奈良線', '近鉄京都線',
        '近鉄橿原線', '近鉄南大阪線', '南海本線', '南海高野線',
        '京阪本線', '京阪京津線', '京阪石山坂本線', '京阪交野線',
        
        // Osaka Metro
        '御堂筋線', '谷町線', '四つ橋線', '中央線', '千日前線',
        '堺筋線', '長堀鶴見緑地線', '今里筋線', 'ニュートラム',
        
        // Other major private railways
        '名鉄名古屋線', '名鉄犬山線', '名鉄西尾線', '名鉄津島線',
        '近鉄名古屋線', '近鉄名古屋本線', '名古屋地下鉄東山線',
        '名古屋地下鉄名城線', '名古屋地下鉄鶴舞線'
    ];
    
    const suggestions: string[] = [];
    const cleanInput = normalizeJapaneseText(invalidName);
    
    // Phase 1: Direct substring matching with normalized text
    for (const line of commonLines) {
        const normalizedLine = normalizeJapaneseText(line);
        
        if (normalizedLine.includes(cleanInput) || 
            cleanInput.includes(normalizedLine) ||
            line.includes(invalidName) || 
            invalidName.includes(line)) {
            
            if (!suggestions.includes(line)) {
                suggestions.push(line);
                if (suggestions.length >= 3) break;
            }
        }
    }
    
    // Phase 2: Character similarity matching if not enough found
    if (suggestions.length < 3) {
        const candidates = commonLines
            .filter(line => !suggestions.includes(line))
            .map(line => ({
                name: line,
                similarity: calculateJapaneseSimilarity(invalidName, line)
            }))
            .filter(candidate => candidate.similarity > 0.25)
            .sort((a, b) => b.similarity - a.similarity);
        
        for (const candidate of candidates) {
            suggestions.push(candidate.name);
            if (suggestions.length >= 3) break;
        }
    }
    
    // Phase 3: Dynamic lookup using WebAssembly module if available
    if (suggestions.length < 3 && module && typeof module.getLineId === 'function') {
        // Try variations of the input
        const variations = generateLineNameVariations(invalidName);
        
        for (const variation of variations) {
            try {
                const lineId = module.getLineId(variation);
                if (lineId > 0 && typeof module.getLineName === 'function') {
                    const lineName = module.getLineName(lineId);
                    if (lineName && lineName !== 'null' && !suggestions.includes(lineName)) {
                        suggestions.push(lineName);
                        if (suggestions.length >= 3) break;
                    }
                }
            } catch (e) {
                // Silently ignore lookup failures
            }
        }
    }
    
    return suggestions.slice(0, 3);
}

// ===============================
// Error Code Classification Utilities
// ===============================

/**
 * Classify error type based on error code and context
 */
function classifyErrorInternal(errorCode: CLIErrorCode | RouteErrorCode): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userActionRequired: boolean;
    recoverable: boolean;
} {
    // CLI Error Code classification
    if (typeof errorCode === 'number') {
        if (errorCode >= CLIErrorCode.WASM_MODULE_NOT_FOUND && errorCode <= CLIErrorCode.WASM_MEMORY_ERROR) {
            return {
                category: 'WebAssembly',
                severity: 'high',
                userActionRequired: true,
                recoverable: true
            };
        }
        
        if (errorCode >= CLIErrorCode.DB_INIT_FAILED && errorCode <= CLIErrorCode.DB_FILE_MISSING) {
            return {
                category: 'Database',
                severity: 'high',
                userActionRequired: true,
                recoverable: true
            };
        }
        
        if (errorCode >= CLIErrorCode.INVALID_STATION_NAME && errorCode <= CLIErrorCode.PARAMETER_COUNT_MISMATCH) {
            return {
                category: 'Input Validation',
                severity: 'low',
                userActionRequired: true,
                recoverable: true
            };
        }
        
        if (errorCode >= CLIErrorCode.ROUTE_CALC_FAILED && errorCode <= CLIErrorCode.INVALID_ROUTE_DATA) {
            return {
                category: 'Route Calculation',
                severity: 'medium',
                userActionRequired: true,
                recoverable: true
            };
        }
    }
    
    // Route Error Code classification
    if (typeof errorCode === 'string') {
        if (errorCode >= RouteErrorCode.ROUTE_ERR_091) {
            return {
                category: 'Critical System',
                severity: 'critical',
                userActionRequired: false,
                recoverable: false
            };
        }
        
        if (errorCode >= RouteErrorCode.ROUTE_ERR_081) {
            return {
                category: 'Complex Routing',
                severity: 'high',
                userActionRequired: true,
                recoverable: true
            };
        }
        
        if (errorCode >= RouteErrorCode.ROUTE_ERR_031 && errorCode <= RouteErrorCode.ROUTE_ERR_040) {
            return {
                category: 'Fare Calculation',
                severity: 'medium',
                userActionRequired: true,
                recoverable: true
            };
        }
        
        if (errorCode >= RouteErrorCode.ROUTE_ERR_011 && errorCode <= RouteErrorCode.ROUTE_ERR_020) {
            return {
                category: 'Input Validation',
                severity: 'low',
                userActionRequired: true,
                recoverable: true
            };
        }
    }
    
    // Default classification
    return {
        category: 'General',
        severity: 'medium',
        userActionRequired: true,
        recoverable: true
    };
}

/**
 * Generate user-friendly error messages based on error classification
 */
function generateUserFriendlyMessageInternal(
    errorCode: CLIErrorCode | RouteErrorCode,
    context?: Record<string, any>
): {
    title: string;
    message: string;
    actionItems: string[];
    jaTitle: string;
    jaMessage: string;
    jaActionItems: string[];
} {
    const classification = classifyErrorInternal(errorCode);
    
    // Default messages
    const defaultMessages = {
        title: 'Error Occurred',
        message: 'An unexpected error occurred while processing your request.',
        actionItems: ['Please try again later.', 'Contact support if the problem persists.'],
        jaTitle: 'エラーが発生しました',
        jaMessage: 'リクエストの処理中に予期しないエラーが発生しました。',
        jaActionItems: ['後でもう一度お試しください。', '問題が続く場合はサポートにお問い合わせください。']
    };
    
    // Customize based on error category
    switch (classification.category) {
        case 'WebAssembly':
            return {
                title: 'WebAssembly Module Error',
                message: 'The WebAssembly module could not be loaded or executed properly.',
                actionItems: [
                    'Run "npm run build" to rebuild the WebAssembly module.',
                    'Check that dist/farert.js and dist/farert.wasm exist.',
                    'Verify file permissions are correct.'
                ],
                jaTitle: 'WebAssemblyモジュールエラー',
                jaMessage: 'WebAssemblyモジュールの読み込みまたは実行に失敗しました。',
                jaActionItems: [
                    '"npm run build" を実行してWebAssemblyモジュールを再ビルドしてください。',
                    'dist/farert.js と dist/farert.wasm ファイルが存在することを確認してください。',
                    'ファイルの権限が正しいことを確認してください。'
                ]
            };
            
        case 'Database':
            return {
                title: 'Database Access Error',
                message: 'The railway database could not be accessed or is corrupted.',
                actionItems: [
                    'Check that data/jrdbnewest.db exists and is readable.',
                    'Verify database file permissions.',
                    'Re-download the database file if corrupted.'
                ],
                jaTitle: 'データベースアクセスエラー',
                jaMessage: '鉄道データベースへのアクセスに失敗したか、データが破損しています。',
                jaActionItems: [
                    'data/jrdbnewest.db ファイルが存在し、読み取り可能であることを確認してください。',
                    'データベースファイルの権限を確認してください。',
                    'データが破損している場合は、データベースファイルを再ダウンロードしてください。'
                ]
            };
            
        case 'Input Validation':
            return {
                title: 'Invalid Input',
                message: 'The provided input contains invalid station or line names.',
                actionItems: [
                    'Use exact Japanese kanji station names (e.g., 東京, 新宿, 大阪).',
                    'Use official line names with proper suffix (e.g., 東海道線, 山手線).',
                    'Check spelling and formatting of all inputs.'
                ],
                jaTitle: '入力エラー',
                jaMessage: '入力された駅名または路線名が無効です。',
                jaActionItems: [
                    '正確な日本語漢字の駅名を使用してください（例: 東京、新宿、大阪）。',
                    '正式な路線名を「〜線」の形式で入力してください（例: 東海道線、山手線）。',
                    'すべての入力のスペルと形式を確認してください。'
                ]
            };
            
        case 'Route Calculation':
            return {
                title: 'Route Calculation Failed',
                message: 'The fare calculation could not be completed for this route.',
                actionItems: [
                    'Verify that all stations are connected by the specified lines.',
                    'Check for valid route connections between stations.',
                    'Try alternative routes if available.'
                ],
                jaTitle: 'ルート計算エラー',
                jaMessage: 'このルートの運賃計算を完了できませんでした。',
                jaActionItems: [
                    'すべての駅が指定された路線で接続されていることを確認してください。',
                    '駅間の有効なルート接続を確認してください。',
                    '可能であれば代替ルートをお試しください。'
                ]
            };
            
        default:
            return defaultMessages;
    }
}

// ===============================
// Text Normalization and Similarity Utilities
// ===============================

/**
 * Normalize Japanese text for better matching
 */
function normalizeJapaneseText(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, '') // Remove spaces
        .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (char) => {
            // Convert full-width to half-width
            return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
}

/**
 * Calculate similarity between two Japanese text strings
 */
function calculateJapaneseSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const normalized1 = normalizeJapaneseText(str1);
    const normalized2 = normalizeJapaneseText(str2);
    
    if (normalized1 === normalized2) return 1;
    
    const chars1 = Array.from(normalized1);
    const chars2 = Array.from(normalized2);
    const longer = chars1.length > chars2.length ? chars1 : chars2;
    const shorter = chars1.length > chars2.length ? chars2 : chars1;
    
    let matches = 0;
    for (const char of shorter) {
        const index = longer.indexOf(char);
        if (index !== -1) {
            matches++;
            longer.splice(index, 1); // Remove matched character
        }
    }
    
    // Weighted similarity: favor matches in shorter strings
    const maxLength = Math.max(chars1.length, chars2.length);
    const minLength = Math.min(chars1.length, chars2.length);
    
    const similarity = (matches * 2) / (chars1.length + chars2.length);
    
    // Bonus for similar length
    const lengthBonus = minLength / maxLength;
    
    return similarity * (0.8 + 0.2 * lengthBonus);
}

/**
 * Generate station name variations for improved matching
 */
function generateStationNameVariations(stationName: string): string[] {
    const variations = [stationName];
    const trimmed = stationName.trim();
    
    if (trimmed !== stationName) {
        variations.push(trimmed);
    }
    
    // Add variations without common suffixes
    const withoutEki = trimmed.replace(/駅$/, '');
    if (withoutEki !== trimmed) {
        variations.push(withoutEki);
    }
    
    // Add variations with common suffixes
    if (!trimmed.endsWith('駅')) {
        variations.push(trimmed + '駅');
    }
    
    // Remove duplicates
    return Array.from(new Set(variations));
}

/**
 * Generate line name variations for improved matching
 */
function generateLineNameVariations(lineName: string): string[] {
    const variations = [lineName];
    const trimmed = lineName.trim();
    
    if (trimmed !== lineName) {
        variations.push(trimmed);
    }
    
    // Add variations without common suffixes
    const withoutSen = trimmed.replace(/線$/, '');
    if (withoutSen !== trimmed) {
        variations.push(withoutSen);
    }
    
    // Add variations with common suffixes
    if (!trimmed.endsWith('線')) {
        variations.push(trimmed + '線');
    }
    
    // Add variations with common prefixes
    if (!trimmed.startsWith('JR')) {
        variations.push('JR' + trimmed);
    }
    
    // Remove duplicates
    return Array.from(new Set(variations));
}

// ===============================
// Validation Utilities
// ===============================

/**
 * Validate route construction parameters with enhanced error reporting
 */
function validateRouteConstructionInternal(
    stations: string[],
    lines: string[],
    module?: FarertModule
): ValidationResult {
    const invalidStations: string[] = [];
    const invalidLines: string[] = [];
    const suggestions: string[] = [];
    
    // Validate stations
    for (const station of stations) {
        if (!station || station.trim().length === 0) {
            invalidStations.push(station);
            continue;
        }
        
        if (module && typeof module.getStationId === 'function') {
            try {
                const stationId = module.getStationId(station.trim());
                if (stationId <= 0) {
                    invalidStations.push(station);
                }
            } catch (e) {
                invalidStations.push(station);
            }
        }
    }
    
    // Validate lines
    for (const line of lines) {
        if (!line || line.trim().length === 0) {
            invalidLines.push(line);
            continue;
        }
        
        if (module && typeof module.getLineId === 'function') {
            try {
                const lineId = module.getLineId(line.trim());
                if (lineId <= 0) {
                    invalidLines.push(line);
                }
            } catch (e) {
                invalidLines.push(line);
            }
        }
    }
    
    // Generate suggestions
    if (invalidStations.length > 0) {
        suggestions.push('以下の駅名を確認してください:');
        for (const station of invalidStations) {
            const stationSuggestions = getFuzzyStationMatches(station, module);
            if (stationSuggestions.length > 0) {
                suggestions.push(`「${station}」→ 候補: ${stationSuggestions.join('、')}`);
            } else {
                suggestions.push(`「${station}」→ 有効な駅名が見つかりません`);
            }
        }
    }
    
    if (invalidLines.length > 0) {
        suggestions.push('以下の路線名を確認してください:');
        for (const line of invalidLines) {
            const lineSuggestions = getFuzzyLineMatches(line, module);
            if (lineSuggestions.length > 0) {
                suggestions.push(`「${line}」→ 候補: ${lineSuggestions.join('、')}`);
            } else {
                suggestions.push(`「${line}」→ 有効な路線名が見つかりません`);
            }
        }
    }
    
    const hasErrors = invalidStations.length > 0 || invalidLines.length > 0;
    
    return {
        isValid: !hasErrors,
        errorCode: hasErrors ? RouteErrorCode.ROUTE_ERR_012 : undefined,
        errorMessage: hasErrors ? 'Invalid stations or lines found' : undefined,
        errorMessageJa: hasErrors ? '無効な駅名または路線名が見つかりました' : undefined,
        suggestions,
        context: {
            invalidStations,
            invalidLines,
            totalStations: stations.length,
            totalLines: lines.length
        },
        severity: hasErrors ? 'error' : 'info',
        timestamp: new Date(),
        relatedCodes: hasErrors ? [
            RouteErrorCode.ROUTE_ERR_011,
            RouteErrorCode.ROUTE_ERR_013,
            CLIErrorCode.INVALID_STATION_NAME,
            CLIErrorCode.INVALID_LINE_NAME
        ] : undefined
    };
}

/**
 * Create a comprehensive error report for debugging
 */
function createErrorReportInternal(
    error: Error,
    context?: Record<string, any>
): string {
    const timestamp = new Date().toISOString();
    let report = `🚨 Error Report (Generated: ${timestamp})\n`;
    report += '='.repeat(60) + '\n\n';
    
    // Error basic information
    report += `Error Type: ${error.name}\n`;
    report += `Error Message: ${error.message}\n\n`;
    
    // Enhanced information for custom error types
    if (error instanceof RouteConstructionError) {
        report += error.getEnhancedErrorReport();
    } else if (error instanceof FareCalculationError) {
        report += error.getEnhancedCalculationReport();
    } else if (error instanceof CLIError) {
        report += error.getFormattedMessage('ja');
    }
    
    // Context information
    if (context) {
        report += '\n📋 Context Information:\n';
        Object.entries(context).forEach(([key, value]) => {
            report += `  ${key}: ${JSON.stringify(value)}\n`;
        });
    }
    
    // Stack trace
    if (error.stack) {
        report += '\n📍 Stack Trace:\n';
        report += error.stack + '\n';
    }
    
    report += '\n' + '='.repeat(60);
    
    return report;
}

// ===============================
// Export all utilities
// ===============================

// Export all utilities with proper naming
export {
    getFuzzyStationMatches as keyMatchStations,  // Alias for existing code compatibility
    getFuzzyLineMatches as keyMatchLines,
    classifyErrorInternal as classifyError,
    generateUserFriendlyMessageInternal as generateUserFriendlyMessage,
    validateRouteConstructionInternal as validateRouteConstruction,
    createErrorReportInternal as createErrorReport,
    normalizeJapaneseText,
    calculateJapaneseSimilarity
};