import React, { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import Controls from './components/Controls';
import NoteEditor from './components/NoteEditor';
import NumericKeyboard from './components/NumericKeyboard';
import { SheetData, HighlightedCells, CellNotes, FilterType } from './types';

declare const XLSX: any;
declare const ExcelJS: any;

type NoteEditorState = {
    visible: true;
    rowIndex: number;
    colIndex: number;
} | { visible: false };

const calculateAutoWidths = (headers: string[], data: SheetData): number[] => {
    const MIN_WIDTH = 80;
    const MAX_WIDTH = 350;
    const PADDING = 20;

    const widths = headers.map(h => (h ? String(h).length : 0));

    data.forEach(row => {
        row.forEach((cell, i) => {
            const cellLength = cell ? String(cell).length : 0;
            if (widths[i] < cellLength) {
                widths[i] = cellLength;
            }
        });
    });

    return widths.map(charCount => 
        Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, charCount * 8 + PADDING))
    );
};

const readInitialWidths = (worksheet: any, headers: string[], data: SheetData): number[] => {
    if (worksheet && worksheet['!cols']) {
        return worksheet['!cols'].map((col: any) => col.wpx || col.wch * 8 || 100);
    }
    return calculateAutoWidths(headers, data);
};

const readInitialNotes = (worksheet: any): CellNotes => {
    const notes: CellNotes = {};
    if (!worksheet) return notes;

    for (const cellAddress in worksheet) {
        if (cellAddress[0] === '!') continue; 

        const cell = worksheet[cellAddress];
        if (cell && cell.c) { 
            try {
                const decodedCell = XLSX.utils.decode_cell(cellAddress);
                if(decodedCell.r > 0) { // Assuming row 0 is headers
                    const commentText = Array.isArray(cell.c) ? cell.c.map((c: any) => c.t).join('\n') : '';
                    notes[`${decodedCell.r - 1}-${decodedCell.c}`] = commentText;
                }
            } catch (err) {
                console.warn(`Error parsing note at ${cellAddress}:`, err);
            }
        }
    }
    return notes;
};

const readInitialHighlights = (worksheet: any): HighlightedCells => {
    const highlights: HighlightedCells = {};
    if (!worksheet) return highlights;

    for (const cellAddress in worksheet) {
        if (cellAddress[0] === '!') continue;

        try {
            const cell = worksheet[cellAddress];
            if (cell && cell.s && cell.s.fill && cell.s.fill.fgColor && cell.s.fill.fgColor.rgb) {
                const rgb = cell.s.fill.fgColor.rgb;
                const colorHex = rgb.length > 6 ? rgb.substring(rgb.length - 6) : rgb;

                if (colorHex.length < 6) continue;

                const r = parseInt(colorHex.substring(0, 2), 16);
                const g = parseInt(colorHex.substring(2, 4), 16);
                const b = parseInt(colorHex.substring(4, 6), 16);

                const isRed = r > 100 && r > g * 1.5 && r > b * 1.5;
                const isGreen = g > 100 && g > r * 1.5 && g > b * 1.5;

                if (isRed || isGreen) {
                    const decodedCell = XLSX.utils.decode_cell(cellAddress);
                    if (decodedCell.r > 0) {
                        const key = `${decodedCell.r - 1}-${decodedCell.c}`;
                        if (isRed) {
                            highlights[key] = 'red';
                        } else if (isGreen) {
                            highlights[key] = 'green';
                        }
                    }
                }
            }
        } catch(err) {
            console.warn(`Error parsing highlight at ${cellAddress}:`, err);
        }
    }
    return highlights;
};

const REVISION_GROUP_PREFIX = 'Ревизионная группа';

const App: React.FC = () => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [sheetData, setSheetData] = useState<SheetData>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [originalWorksheet, setOriginalWorksheet] = useState<any>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [highlightedCells, setHighlightedCells] = useState<HighlightedCells>({});
    const [highlightedHeaderIndices, setHighlightedHeaderIndices] = useState<Set<number>>(new Set());
    const [notes, setNotes] = useState<CellNotes>({});
    const [noteEditorState, setNoteEditorState] = useState<NoteEditorState>({ visible: false });
    const [columnWidths, setColumnWidths] = useState<number[]>([]);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [highlightMode, setHighlightMode] = useState(false);
    const [controlsHeight, setControlsHeight] = useState(0);
    const controlsRef = useRef<HTMLDivElement>(null);
    
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [scrollToRowIndex, setScrollToRowIndex] = useState<number | null>(null);
    const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setSelectedCell(null);
    }, [filter]);

    useLayoutEffect(() => {
        const updateHeight = () => {
            if (controlsRef.current) {
                setControlsHeight(controlsRef.current.offsetHeight);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [fileName]); // Recalculate when file is loaded/unloaded

    const handleFileProcessed = useCallback((newHeaders: string[], newData: SheetData, newFileName: string, worksheet: any) => {
        const initialNotesData = readInitialNotes(worksheet);
        const initialHighlightsData = readInitialHighlights(worksheet);

        setHeaders(newHeaders);
        setSheetData(newData);
        setFileName(newFileName);
        setOriginalWorksheet(worksheet);
        setSearchQuery('');
        setHighlightedCells(initialHighlightsData);
        setHighlightedHeaderIndices(new Set());
        setError('');
        setFilter('all');
        setColumnWidths(readInitialWidths(worksheet, newHeaders, newData));
        setNotes(initialNotesData);
        setNoteEditorState({ visible: false });
        setKeyboardVisible(false);
        setHighlightMode(false);
        setSelectedCell(null);
    }, []);
    
    const filteredData = useMemo(() => {
        const sourceData = sheetData.map((row, index) => ({ row, originalIndex: index }));

        if (filter === 'all') {
            return sourceData;
        }

        return sourceData.filter(({ row, originalIndex }) => {
            let hasGreen = false;
            let hasRed = false;
            let hasAnyColor = false;

            for (let i = 0; i < row.length; i++) {
                const color = highlightedCells[`${originalIndex}-${i}`];
                if (color === 'green') {
                    hasGreen = true;
                    hasAnyColor = true;
                } else if (color === 'red') {
                    hasRed = true;
                    hasAnyColor = true;
                }
            }

            switch (filter) {
                case 'green': return hasGreen;
                case 'red': return hasRed;
                case 'none': return !hasAnyColor;
                default: return true;
            }
        });
    }, [sheetData, filter, highlightedCells]);

    const searchMatches = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return [];
        const matches: number[] = [];
        const query = debouncedSearchQuery.toLowerCase();
        
        filteredData.forEach(({ originalIndex, row }) => {
            for (const cell of row) {
                if (String(cell ?? '').toLowerCase().includes(query)) {
                    matches.push(originalIndex);
                    break;
                }
            }
        });
        return matches;
    }, [filteredData, debouncedSearchQuery]);

    useEffect(() => {
        if (searchMatches.length > 0) {
            setCurrentMatchIndex(0);
            setScrollToRowIndex(searchMatches[0]);
        } else {
            setCurrentMatchIndex(0);
            setScrollToRowIndex(null);
        }
    }, [searchMatches]);

    const handleNavigateMatch = (direction: 'next' | 'prev') => {
        if (searchMatches.length === 0) return;
        
        let nextIndex = direction === 'next' 
            ? currentMatchIndex + 1 
            : currentMatchIndex - 1;

        if (nextIndex >= 0 && nextIndex < searchMatches.length) {
            setCurrentMatchIndex(nextIndex);
            setScrollToRowIndex(searchMatches[nextIndex]);
        }
    };
    
    const revisionGroupColIndex = useMemo(() => 
        headers.findIndex(h => h.trim().startsWith(REVISION_GROUP_PREFIX)), 
    [headers]);

    const revisionGroupIndices = useMemo(() =>
        sheetData.map((row, i) =>
            String(row[0] ?? '').trim().startsWith(REVISION_GROUP_PREFIX) ? i : -1
        ).filter(i => i !== -1),
    [sheetData]);

    const handleHeaderClick = (colIndex: number) => {
        if (colIndex !== revisionGroupColIndex) return;
        
        setHighlightedHeaderIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(colIndex)) {
                newSet.delete(colIndex);
            } else {
                newSet.add(colIndex);
            }
            return newSet;
        });
    };

    const handleColumnResize = useCallback((index: number, newWidth: number) => {
        setColumnWidths(prevWidths => {
            const newWidths = [...prevWidths];
            newWidths[index] = newWidth;
            return newWidths;
        });
    }, []);
    
    const handleCellClick = (rowIndex: number, colIndex: number) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        
        setHighlightedCells(prev => {
            const newHighlights = { ...prev };
            const currentColor = newHighlights[cellKey];
            let nextColor: 'red' | 'green' | undefined;

            if (currentColor === 'green') {
                newHighlights[cellKey] = 'red';
                nextColor = 'red';
            } else if (currentColor === 'red') {
                delete newHighlights[cellKey];
                nextColor = undefined;
            } else {
                newHighlights[cellKey] = 'green';
                nextColor = 'green';
            }
            
            if (revisionGroupColIndex !== -1) {
                const revisionGroupCellKey = `${rowIndex}-${revisionGroupColIndex}`;

                if (nextColor === 'red') {
                    newHighlights[revisionGroupCellKey] = 'red';
                } else if (currentColor === 'red' && nextColor === undefined) {
                    let hasOtherRedCells = false;
                    for (let i = 0; i < headers.length; i++) {
                        if (newHighlights[`${rowIndex}-${i}`] === 'red') {
                            hasOtherRedCells = true;
                            break;
                        }
                    }
                    if (!hasOtherRedCells) {
                        delete newHighlights[revisionGroupCellKey];
                    }
                }
            }
            return newHighlights;
        });
    };
    
    const handleCellSelect = useCallback((rowIndex: number, colIndex: number) => {
        if (selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex) {
            setSelectedCell(null);
        } else {
            setSelectedCell({ row: rowIndex, col: colIndex });
        }
    }, [selectedCell]);

    const handleRequestNoteEditor = () => {
        if (selectedCell) {
            setNoteEditorState({ visible: true, rowIndex: selectedCell.row, colIndex: selectedCell.col });
        }
    };

    const handleSaveNote = (note: string) => {
        if (!noteEditorState.visible) return;
        const { rowIndex, colIndex } = noteEditorState;
        const cellKey = `${rowIndex}-${colIndex}`;

        setNotes(prev => {
            const newNotes = { ...prev };
            if (note.trim()) {
                newNotes[cellKey] = note.trim();
            } else {
                delete newNotes[cellKey];
            }
            return newNotes;
        });
        setNoteEditorState({ visible: false });
    };

    const handleSaveFile = async () => {
        if (!fileName) return;
    
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Основной лист");
    
            // Add headers
            worksheet.addRow(headers.map(h => h ?? ''));
    
            // Add data with styles and comments
            sheetData.forEach((row, rowIndex) => {
                const excelRow = worksheet.addRow(row.map(c => c ?? null));
    
                row.forEach((cell, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const excelCell = excelRow.getCell(colIndex + 1);
    
                    // Apply color
                    if (highlightedCells[cellKey]) {
                        excelCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: {
                                argb: highlightedCells[cellKey] === 'green' 
                                    ? 'FF00B050' 
                                    : 'FFFF0000'
                            }
                        };
                    }
    
                    if (notes[cellKey]) {
                        excelCell.note = notes[cellKey];
                    }
                });
            });
    
            if (headers.length > 0) {
                for (let i = 1; i <= headers.length; i++) {
                    if (i === 1) {
                        worksheet.getColumn(1).width = 5;
                    } else {
                        worksheet.getColumn(i).width = Math.max(10, (columnWidths[i - 1] || 80) / 8);
                    }
                }
            }
    
            const redRowIndexes = new Set<number>();
            Object.keys(highlightedCells).forEach(key => {
                if (highlightedCells[key] === 'red') {
                    redRowIndexes.add(parseInt(key.split('-')[0], 10));
                }
            });
    
            if (redRowIndexes.size > 0) {
                const redWorksheet = workbook.addWorksheet("Выделено красным");
                redWorksheet.addRow(headers.map(h => h ?? ''));
    
                const sortedRedRowIndexes = Array.from(redRowIndexes).sort((a, b) => a - b);
                let lastAddedSubheaderIndex = -1;
    
                sortedRedRowIndexes.forEach(rowIndex => {
                     let subheaderIndex = -1;
                     for (let i = revisionGroupIndices.length - 1; i >= 0; i--) {
                         if (revisionGroupIndices[i] <= rowIndex) {
                             subheaderIndex = revisionGroupIndices[i];
                             break;
                         }
                     }
    
                    if (subheaderIndex !== -1 && subheaderIndex !== lastAddedSubheaderIndex) {
                        redWorksheet.addRow(sheetData[subheaderIndex].map(c => c ?? null));
                        lastAddedSubheaderIndex = subheaderIndex;
                    }
    
                    redWorksheet.addRow(sheetData[rowIndex].map(c => c ?? null));
                });
    
                if (headers.length > 0) {
                    for (let i = 1; i <= headers.length; i++) {
                        if (i === 1) {
                            redWorksheet.getColumn(1).width = 5;
                        } else {
                            redWorksheet.getColumn(i).width = Math.max(10, (columnWidths[i - 1] || 80) / 8);
                        }
                    }
                }
            }
    
            const newFileName = `edited_${fileName}`;
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = newFileName;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);  
            }, 100);
    
        } catch (err) {
            console.error("Ошибка сохранения:", err);
            setError("Не удалось сохранить файл. Попробуйте еще раз.");
        }
    };
    
    const handleNumericKeyPress = (key: string) => {
        setSearchQuery(prev => prev + key);
    };

    const handleNumericBackspace = () => {
        setSearchQuery(prev => prev.slice(0, -1));
    };
    
    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const resetApp = () => {
        setFileName(null);
        setHeaders([]);
        setSheetData([]);
        setLoading(false);
        setError('');
        setSearchQuery('');
        setFilter('all');
        setHighlightedCells({});
        setNotes({});
        setColumnWidths([]);
        setNoteEditorState({ visible: false });
        setKeyboardVisible(false);
        setHighlightedHeaderIndices(new Set());
        setHighlightMode(false);
        setOriginalWorksheet(null);
        setSelectedCell(null);
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex items-center justify-center h-full"><p className="text-lg text-gray-300">Обработка файла...</p></div>;
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <p className="text-lg text-red-500 mb-4">{error}</p>
                    <button onClick={resetApp} className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-500">Попробовать снова</button>
                </div>
            );
        }

        if (fileName && sheetData.length > 0) {
            return (
                <div className="flex flex-col h-full w-full">
                    <div ref={controlsRef}>
                        <Controls 
                            fileName={fileName} 
                            searchQuery={searchQuery} 
                            setSearchQuery={setSearchQuery} 
                            onReset={resetApp} 
                            onSave={handleSaveFile}
                            filter={filter}
                            setFilter={setFilter}
                            onSearchFocus={() => setKeyboardVisible(true)}
                            searchMatchCount={searchMatches.length}
                            currentMatchIndex={currentMatchIndex}
                            onNavigateMatch={handleNavigateMatch}
                        />
                    </div>
                    <DataTable
                        headers={headers}
                        data={filteredData}
                        searchMatches={searchMatches}
                        highlightedCells={highlightedCells}
                        notes={notes}
                        onCellClick={handleCellClick}
                        onCellSelect={handleCellSelect}
                        selectedCell={selectedCell}
                        columnWidths={columnWidths}
                        onColumnResize={handleColumnResize}
                        highlightedHeaderIndices={highlightedHeaderIndices}
                        onHeaderClick={handleHeaderClick}
                        highlightMode={highlightMode}
                        controlsHeight={controlsHeight}
                        scrollToRowIndex={scrollToRowIndex}
                    />
                </div>
            );
        }

        return <FileUpload onFileProcessed={handleFileProcessed} setLoading={setLoading} setError={setError} />;
    };

    return (
        <main className="bg-black text-gray-100 h-screen w-screen overflow-hidden flex flex-col">
            {renderContent()}
            {noteEditorState.visible && (
                <NoteEditor 
                    note={notes[`${noteEditorState.rowIndex}-${noteEditorState.colIndex}`] || ''}
                    onSave={handleSaveNote}
                    onClose={() => setNoteEditorState({ visible: false })}
                />
            )}
            {isKeyboardVisible && (
                <NumericKeyboard 
                    onKeyPress={handleNumericKeyPress}
                    onBackspace={handleNumericBackspace}
                    onDone={() => setKeyboardVisible(false)}
                    onClear={handleClearSearch}
                    highlightMode={highlightMode}
                    onHighlightToggle={() => {
                        setHighlightMode(prev => !prev);
                        setSelectedCell(null);
                    }}
                    onAddNote={handleRequestNoteEditor}
                    isCellSelected={!!selectedCell}
                />
            )}
        </main>
    );
};

export default App;