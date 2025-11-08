
import React, { useState, useRef, useEffect } from 'react';
import { ClearIcon, SaveIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { FilterType } from '../types';

interface ControlsProps {
    fileName: string;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onReset: () => void;
    onSave: () => void;
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
    onSearchFocus: () => void;
    searchMatchCount: number;
    currentMatchIndex: number;
    onNavigateMatch: (direction: 'next' | 'prev') => void;
}

const Controls: React.FC<ControlsProps> = ({ 
    fileName, 
    searchQuery, 
    setSearchQuery, 
    onReset, 
    onSave, 
    filter, 
    setFilter, 
    onSearchFocus,
    searchMatchCount,
    currentMatchIndex,
    onNavigateMatch
}) => {
    const [isFilterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const filterOptions: { value: FilterType, label: string }[] = [
        { value: 'all', label: 'Все строки' },
        { value: 'green', label: 'Зеленые' },
        { value: 'red', label: 'Красные' },
        { value: 'none', label: 'Без цвета' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-sm p-2 sm:p-3 border-b border-gray-700">
            <div className="flex items-center gap-2 w-full">
                <button 
                    onClick={onReset} 
                    className="p-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 transition-colors flex-shrink-0"
                    title="Открыть новый файл"
                 >
                    <PlusIcon className="w-5 h-5" />
                </button>
                <div className="relative flex-grow min-w-0">
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        readOnly
                        onFocus={onSearchFocus}
                        className="w-full pl-3 pr-8 py-2 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-400 text-white cursor-pointer"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-yellow-400"
                            aria-label="Очистить поиск"
                        >
                            <ClearIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {searchMatchCount > 0 && (
                    <div className="flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 flex-shrink-0">
                        <span className="text-xs text-gray-300">{currentMatchIndex + 1} из {searchMatchCount}</span>
                        <button onClick={() => onNavigateMatch('prev')} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentMatchIndex <= 0}>
                            <ChevronLeftIcon className="w-4 h-4 text-gray-200" />
                        </button>
                        <button onClick={() => onNavigateMatch('next')} className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentMatchIndex >= searchMatchCount - 1}>
                            <ChevronRightIcon className="w-4 h-4 text-gray-200" />
                        </button>
                    </div>
                )}
                
                <div className="relative flex-shrink-0" ref={filterRef}>
                    <button 
                        onClick={() => setFilterOpen(prev => !prev)}
                        className="p-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 transition-colors border border-gray-600"
                        title="Фильтр"
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 overflow-hidden">
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFilter(option.value);
                                        setFilterOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm ${filter === option.value ? 'bg-yellow-500 text-black' : 'text-gray-200 hover:bg-gray-700'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            <div className="border-t border-gray-600"></div>
                            <button
                                onClick={() => {
                                    setFilter('all');
                                    setFilterOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                            >
                                Сбросить фильтр
                            </button>
                        </div>
                    )}
                </div>
                
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-2 rounded-md transition-colors flex-shrink-0"
                    title="Сохранить изменения в новом файле XLSX"
                >
                    <SaveIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Controls;
