/**
 * Example usage of Farert React Provider
 * Demonstrates basic patterns and best practices
 * 
 * Requirements: REQ-API-003 - React Integration Examples
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FarertProvider,
  FarertErrorBoundary,
  useFarert,
  useRouteBuilder,
  type RouteSegment,
  type FareCalculationResult,
  type StationSearchResult,
  type RouteSegmentInfo
} from './index';

/**
 * Basic application wrapper with provider and error boundary
 */
export function FarertAppExample() {
  const [isReady, setIsReady] = useState(false);
  
  return (
    <FarertErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Farert Error:', error.getFormattedMessage());
        console.error('Error Info:', errorInfo);
      }}
      fallback={FarertErrorFallback}
    >
      <FarertProvider
        config={{
          enableCache: true,
          debugMode: true,
          autoRetry: true
        }}
        maxRetries={3}
        onInitialized={() => {
          console.log('✅ Farert SDK initialized successfully');
          setIsReady(true);
        }}
        onError={(error) => {
          console.error('❌ Farert initialization error:', error.getFormattedMessage());
        }}
      >
        <div className="farert-app">
          <h1>Japanese Railway Fare Calculator</h1>
          {isReady ? (
            <>
              <StationSearchExample />
              <RouteBuilderExample />
              <RouteCalculatorExample />
              <SystemStatusExample />
            </>
          ) : (
            <LoadingIndicator />
          )}
        </div>
      </FarertProvider>
    </FarertErrorBoundary>
  );
}

/**
 * Custom error fallback component
 */
function FarertErrorFallback({ error, hasError }: { error?: Error; hasError: boolean }) {
  if (!hasError) return null;
  
  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ff4444',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      margin: '20px'
    }}>
      <h2 style={{ color: '#cc0000', margin: '0 0 15px 0' }}>
        🚨 Railway System Error
      </h2>
      
      <p style={{ margin: '0 0 15px 0', fontFamily: 'monospace' }}>
        {error?.message || 'An unexpected error occurred in the railway system'}
      </p>
      
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Reload Application
      </button>
    </div>
  );
}

/**
 * Loading indicator while initializing
 */
function LoadingIndicator() {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ 
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #0066cc',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ marginTop: '20px', color: '#666' }}>
        🚅 Loading Railway System...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Example: Station search functionality
 */
function StationSearchExample() {
  const { searchStations, isReady, error } = useFarert();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !isReady) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const searchResults = await searchStations(searchQuery);
      setResults(searchResults);
    } catch (err) {
      console.error('Station search error:', err);
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchStations, isReady]);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, handleSearch]);
  
  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>🔍 Station Search</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="駅名を入力してください (例: 東京、新宿、大阪)"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px'
          }}
          disabled={!isReady}
        />
      </div>
      
      {isSearching && (
        <p style={{ color: '#0066cc', fontStyle: 'italic' }}>
          🔄 Searching...
        </p>
      )}
      
      {searchError && (
        <p style={{ color: '#cc0000', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '4px' }}>
          ❌ {searchError}
        </p>
      )}
      
      {results.length > 0 && (
        <div>
          <h4>検索結果 ({results.length}件)</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map((station) => (
              <li 
                key={station.id}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9'
                }}
                onClick={() => console.log('Selected station:', station)}
              >
                <strong>{station.name}</strong>
                {station.nameEx !== station.name && (
                  <span style={{ marginLeft: '10px', color: '#666' }}>
                    ({station.nameEx})
                  </span>
                )}
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                  ID: {station.id}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {query && !isSearching && results.length === 0 && !searchError && (
        <p style={{ color: '#999', fontStyle: 'italic' }}>
          該当する駅が見つかりませんでした
        </p>
      )}
    </div>
  );
}

/**
 * Example: Route calculation functionality
 */
function RouteCalculatorExample() {
  const { calculateFare, isReady } = useFarert();
  const [route, setRoute] = useState<RouteSegment[]>([]);
  const [result, setResult] = useState<FareCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  
  // Example route: Tokyo to Yokohama
  const loadExampleRoute = () => {
    setRoute([
      { stationId: 1001, stationName: '東京' },  // Example IDs - would be real in actual implementation
      { stationId: 1002, stationName: '横浜' }
    ]);
  };
  
  const handleCalculate = async () => {
    if (route.length < 2 || !isReady) {
      return;
    }
    
    setIsCalculating(true);
    setCalcError(null);
    setResult(null);
    
    try {
      const fareResult = await calculateFare(route);
      setResult(fareResult);
    } catch (err) {
      console.error('Fare calculation error:', err);
      setCalcError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>💰 Fare Calculation</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={loadExampleRoute}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
          disabled={!isReady}
        >
          📍 Load Example Route (Tokyo → Yokohama)
        </button>
        
        <button
          onClick={handleCalculate}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={!isReady || route.length < 2 || isCalculating}
        >
          {isCalculating ? '🔄 Calculating...' : '🚅 Calculate Fare'}
        </button>
      </div>
      
      {route.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4>現在のルート:</h4>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            {route.map((segment, index) => (
              <span key={index}>
                {segment.stationName}
                {index < route.length - 1 && ' → '}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {calcError && (
        <p style={{ color: '#cc0000', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '4px' }}>
          ❌ {calcError}
        </p>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px',
          border: '1px solid #28a745'
        }}>
          <h4 style={{ color: '#155724', margin: '0 0 10px 0' }}>
            ✅ Fare Calculation Result
          </h4>
          
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
            Total Fare: ¥{result.fareInfo.fare.toLocaleString()}
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <div>Calculation Time: {result.calculationTimeMs}ms</div>
            <div>Calculated At: {result.calculatedAt.toLocaleString('ja-JP')}</div>
          </div>
          
          {result.fareInfo.routeList && (
            <div style={{ marginTop: '10px' }}>
              <strong>Route Details:</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '5px' }}>
                {result.fareInfo.routeList}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example: System status and debugging
 */
function SystemStatusExample() {
  const farert = useFarert();
  const {
    isReady,
    isLoading,
    hasError,
    error,
    retryCount,
    maxRetries,
    canRetry,
    module,
    config,
    retry,
    clearError,
    clearCache
  } = farert;
  
  const getStatusIcon = () => {
    if (isLoading) return '🔄';
    if (hasError) return '❌';
    if (isReady) return '✅';
    return '⏳';
  };
  
  const getStatusText = () => {
    if (isLoading) return 'Loading...';
    if (hasError) return 'Error';
    if (isReady) return 'Ready';
    return 'Initializing...';
  };
  
  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>🔧 System Status</h3>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: isReady ? '#e8f5e8' : hasError ? '#fff5f5' : '#fff8e1',
        borderRadius: '4px',
        marginBottom: '15px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          {getStatusIcon()} Status: {getStatusText()}
        </div>
        
        {hasError && error && (
          <div style={{ color: '#cc0000', marginBottom: '10px' }}>
            <strong>Error:</strong> {error.message}
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Code: {error.code} | Retry: {retryCount}/{maxRetries}
            </div>
          </div>
        )}
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>WebAssembly Module: {module ? 'Loaded' : 'Not loaded'}</div>
          <div>Cache Enabled: {config.enableCache ? 'Yes' : 'No'}</div>
          <div>Debug Mode: {config.debugMode ? 'Yes' : 'No'}</div>
          <div>Auto Retry: {config.autoRetry ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {hasError && canRetry && (
          <button
            onClick={retry}
            style={{
              padding: '8px 15px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        )}
        
        {hasError && (
          <button
            onClick={clearError}
            style={{
              padding: '8px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Error
          </button>
        )}
        
        <button
          onClick={clearCache}
          style={{
            padding: '8px 15px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={!isReady}
        >
          🧹 Clear Cache
        </button>
        
        <button
          onClick={() => console.log('Farert Context:', farert)}
          style={{
            padding: '8px 15px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 Debug Info
        </button>
      </div>
    </div>
  );
}

/**
 * Route builder example using the useRouteBuilder hook
 */
function RouteBuilderExample() {
  const {
    segments,
    addStation,
    removeStation,
    moveStation,
    clear,
    validation,
    fareResult,
    isLoading,
    undo,
    redo,
    canUndo,
    canRedo,
    onDragStart,
    onDragOver,
    onDragEnd,
    dragState
  } = useRouteBuilder({
    maxStations: 8,
    enableRealTimeCalculation: true,
    enableDragDrop: true,
    onFareCalculated: (result) => {
      console.log('Fare calculated:', result?.totalFare);
    }
  });

  const [newStationName, setNewStationName] = useState('');
  const { farert } = useFarert();

  const handleAddStation = useCallback(async () => {
    if (!farert || !newStationName.trim()) return;
    
    const stationId = farert.getStationId(newStationName.trim());
    if (stationId > 0) {
      try {
        await addStation(stationId);
        setNewStationName('');
      } catch (error) {
        console.error('Failed to add station:', error);
      }
    } else {
      alert('駅が見つかりません: ' + newStationName);
    }
  }, [farert, newStationName, addStation]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart?.(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    onDragOver?.(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveStation(dragIndex, dropIndex);
    }
    onDragEnd?.();
  };

  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>🚅 Route Builder (with Drag & Drop)</h3>
      
      {/* Add station controls */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newStationName}
          onChange={(e) => setNewStationName(e.target.value)}
          placeholder="駅名を入力 (例: 東京)"
          style={{ width: '200px', padding: '8px', marginRight: '10px' }}
        />
        <button 
          onClick={handleAddStation}
          disabled={!newStationName.trim() || segments.length >= 8}
          style={{ padding: '8px 16px', marginRight: '10px' }}
        >
          駅を追加
        </button>
        <button 
          onClick={clear}
          disabled={segments.length === 0}
          style={{ padding: '8px 16px' }}
        >
          クリア
        </button>
      </div>

      {/* Undo/Redo controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={undo}
          disabled={!canUndo}
          style={{ padding: '8px 16px', marginRight: '10px' }}
        >
          元に戻す
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          style={{ padding: '8px 16px' }}
        >
          やり直し
        </button>
      </div>

      {/* Route segments */}
      <div style={{ marginBottom: '20px' }}>
        <h4>経路 ({segments.length}/8駅)</h4>
        {segments.length === 0 ? (
          <p style={{ color: '#666' }}>駅が追加されていません</p>
        ) : (
          <div>
            {segments.map((segment, index) => (
              <div
                key={`${segment.stationId}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: dragState.dragOverIndex === index ? '#e3f2fd' : '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'move',
                  opacity: dragState.isDragging && dragState.dragIndex === index ? 0.5 : 1
                }}
              >
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
                  {index + 1}.
                </span>
                <span style={{ flex: 1 }}>
                  {segment.stationName} (ID: {segment.stationId})
                </span>
                {segment.lineName && (
                  <span style={{ marginRight: '10px', color: '#666' }}>
                    via {segment.lineName}
                  </span>
                )}
                <button
                  onClick={() => removeStation(index)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation results */}
      {validation.errors.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          <h4 style={{ color: '#d63031', marginTop: 0 }}>検証エラー:</h4>
          {validation.errors.map((error, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              • {error.message}
            </div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h4 style={{ color: '#856404', marginTop: 0 }}>警告:</h4>
          {validation.warnings.map((warning, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              • {warning.message}
            </div>
          ))}
        </div>
      )}

      {/* Fare result */}
      {fareResult && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <h4 style={{ color: '#155724', marginTop: 0 }}>運賃計算結果:</h4>
          <div><strong>運賃:</strong> ¥{fareResult.totalFare.toLocaleString()}</div>
          <div><strong>距離:</strong> {fareResult.totalDistance}km</div>
          <div><strong>乗換:</strong> {fareResult.transfers}回</div>
          {fareResult.fareBreakdown.length > 1 && (
            <div style={{ marginTop: '10px' }}>
              <strong>内訳:</strong>
              {fareResult.fareBreakdown.map((item, index) => (
                <div key={index} style={{ marginLeft: '10px' }}>
                  • {item.description}: ¥{item.amount.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
          計算中...
        </div>
      )}

      {/* Status */}
      <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
        <strong>状態:</strong> {validation.isValid ? '有効' : '無効'} | 
        <strong> ドラッグ中:</strong> {dragState.isDragging ? 'はい' : 'いいえ'} |
        <strong> 読み込み中:</strong> {isLoading ? 'はい' : 'いいえ'}
      </div>
    </div>
  );
}

export default FarertAppExample;